require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const multer = require('multer');
const fs = require('fs');
const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);
const { db, initDb, migrateDb } = require('./database');
const { authenticateToken, isAdmin, JWT_SECRET } = require('./auth');

const app = express();
const PORT = process.env.PORT || 8080;

// Persistent dirs: stored ONE LEVEL ABOVE project root so Git deploys never wipe them.
// Override any of these via environment variables in hPanel.
const PERSISTENT_ROOT = process.env.PERSISTENT_ROOT || path.join(__dirname, '..');
const TEMPLATES_DIR = process.env.TEMPLATES_DIR || path.join(PERSISTENT_ROOT, 'templates');
const EXPORTS_DIR   = process.env.EXPORTS_DIR   || path.join(PERSISTENT_ROOT, 'exports');
const UPLOADS_DIR   = process.env.UPLOADS_DIR   || path.join(PERSISTENT_ROOT, 'uploads');

// Auto-create all persistent directories on startup
[TEMPLATES_DIR, EXPORTS_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer Storage for Templates
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMPLATES_DIR),
  filename: (req, file, cb) => {
    const typeId = req.params.id; // e.g., CON_DG
    cb(null, `${typeId}.xlsx`);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// 1. STATIC FRONTEND SERVING
const DIST_PATH = path.join(__dirname, 'dist');
app.use(express.static(DIST_PATH));

// 2. AUTH ROUTES
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM profiles WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, forcePasswordChange: !!user.force_password_change } });
  });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { newPassword } = req.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.run(`UPDATE profiles SET password = ?, force_password_change = 0 WHERE id = ?`, [hashedPassword, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 3. TRACKING ROUTES (SO Records)
app.get('/api/records', authenticateToken, (req, res) => {
  const { status } = req.query;
  let sql = `SELECT r.* FROM so_records r WHERE r.is_active = 1`;
  let params = [];

  if (status && status !== 'all') {
    sql += ` AND r.status = ?`;
    params.push(status);
  }
  if (req.user.role !== 'admin') {
    sql += ` AND r.user_id = ?`;
    params.push(req.user.id);
  }
  sql += ` ORDER BY r.created_at DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Fetch logs for a specific SO
app.get('/api/records/:id/logs', authenticateToken, (req, res) => {
  db.all(
    `SELECT l.*, p.full_name as modifier_name 
     FROM shipment_logs l 
     LEFT JOIN profiles p ON l.modifier_id = p.id 
     WHERE l.so_id = ? 
     ORDER BY l.timestamp ASC`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/records', authenticateToken, (req, res) => {
  const { so_number, customer_name, equipment_type, dangerous_type, etd, notes, template_config_id } = req.body;
  if (!so_number || !customer_name || !etd) return res.status(400).json({ error: 'so_number, customer_name, and etd are required.' });
  const id = uuidv4();
  db.run(
    `INSERT INTO so_records (id, user_id, so_number, customer_name, equipment_type, dangerous_type, etd, notes, template_config_id, is_active) VALUES (?,?,?,?,?,?,?,?,?,1)`,
    [id, req.user.id, so_number, customer_name, equipment_type || '', dangerous_type || '', etd, notes || null, template_config_id || null],
    (err) => {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'SO Number already exists.' });
        return res.status(500).json({ error: err.message });
      }
      const logId = uuidv4();
      db.run(
        `INSERT INTO shipment_logs (id, so_id, modifier_id, action, comment, updated_by, new_data) VALUES (?,?,?,?,?,?,?)`,
        [logId, id, req.user.id, 'Created', 'Initial SO entry added.', req.user.fullName || req.user.email,
         JSON.stringify({ so_number, customer_name, equipment_type, dangerous_type, etd, notes })],
        () => res.json({ id, success: true })
      );
    }
  );
});

// 4. CUSTOMER ROUTES
app.get('/api/customers', authenticateToken, (req, res) => {
  let sql = `SELECT * FROM customers`;
  let params = [];
  if (req.user.role !== 'admin') {
    sql += ` WHERE user_id = ?`;
    params.push(req.user.id);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/customers', authenticateToken, (req, res) => {
  const { name } = req.body;
  const id = uuidv4();
  db.run(`INSERT INTO customers (id, user_id, name) VALUES (?, ?, ?)`, [id, req.user.id, name], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, success: true });
  });
});

app.delete('/api/customers/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM customers WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// UPDATE SO RECORD — saves old_data + new_data snapshots
app.put('/api/records/:id', authenticateToken, (req, res) => {
  const { so_number, customer_name, etd, equipment_type, dangerous_type, manual_priority, comment } = req.body;
  if (!comment) return res.status(400).json({ error: 'Reason for change (comment) is mandatory.' });

  // Fetch old record first for audit snapshot
  db.get(`SELECT * FROM so_records WHERE id=?`, [req.params.id], (err, old) => {
    if (err || !old) return res.status(404).json({ error: 'Record not found.' });

    db.run(
      `UPDATE so_records SET so_number=?, customer_name=?, etd=?, equipment_type=?, dangerous_type=?, manual_priority=? WHERE id=?`,
      [so_number, customer_name, etd, equipment_type, dangerous_type, manual_priority || null, req.params.id],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const logId = uuidv4();
        db.run(
          `INSERT INTO shipment_logs (id, so_id, modifier_id, action, comment, old_data, new_data, updated_by) VALUES (?,?,?,?,?,?,?,?)`,
          [logId, req.params.id, req.user.id, 'Manual-Update', comment,
           JSON.stringify({ so_number: old.so_number, customer_name: old.customer_name, etd: old.etd, equipment_type: old.equipment_type, dangerous_type: old.dangerous_type, manual_priority: old.manual_priority }),
           JSON.stringify({ so_number, customer_name, etd, equipment_type, dangerous_type, manual_priority }),
           req.user.email],
          () => res.json({ success: true })
        );
      }
    );
  });
});

// SOFT DELETE SO RECORD (never physically deleted per spec)
app.delete('/api/records/:id', authenticateToken, (req, res) => {
  db.run(`UPDATE so_records SET is_active=0 WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const logId = uuidv4();
    db.run(`INSERT INTO shipment_logs (id, so_id, modifier_id, action, comment, updated_by) VALUES (?,?,?,?,?,?)`,
      [logId, req.params.id, req.user.id, 'Deleted', 'Record soft-deleted (hidden).', req.user.email]);
    res.json({ success: true });
  });
});

// UPDATE SO STATUS (mark done / reopen)
app.post('/api/records/:id/status', authenticateToken, (req, res) => {
  const { status, comment } = req.body;
  const completedAt = status === 'done' ? new Date().toISOString() : null;
  db.run(
    `UPDATE so_records SET status=?, completed_at=? WHERE id=?`,
    [status, completedAt, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      const logId = uuidv4();
      db.run(
        `INSERT INTO shipment_logs (id, so_id, modifier_id, action, comment) VALUES (?, ?, ?, ?, ?)`,
        [logId, req.params.id, req.user.id, status === 'done' ? 'Completed' : 'Reopened', comment || `Status set to ${status}.`],
        () => res.json({ success: true })
      );
    }
  );
});

// ─── 5. DYNAMIC CONFIG ROUTES ────────────────────────────────────────────────

// Equipment Types
app.get('/api/equipment-types', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM equipment_types ORDER BY name ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/equipment-types', authenticateToken, isAdmin, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required.' });
  const id = uuidv4();
  db.run(`INSERT INTO equipment_types (id, name) VALUES (?, ?)`, [id, name.trim()], (err) => {
    if (err) {
      if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Already exists.' });
      return res.status(500).json({ error: err.message });
    }
    res.json({ id, name: name.trim(), success: true });
  });
});
app.delete('/api/equipment-types/:id', authenticateToken, isAdmin, (req, res) => {
  db.run(`DELETE FROM equipment_types WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Cargo Categories
app.get('/api/cargo-categories', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM cargo_categories ORDER BY name ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/cargo-categories', authenticateToken, isAdmin, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required.' });
  const id = uuidv4();
  db.run(`INSERT INTO cargo_categories (id, name) VALUES (?, ?)`, [id, name.trim()], (err) => {
    if (err) {
      if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Already exists.' });
      return res.status(500).json({ error: err.message });
    }
    res.json({ id, name: name.trim(), success: true });
  });
});
app.delete('/api/cargo-categories/:id', authenticateToken, isAdmin, (req, res) => {
  db.run(`DELETE FROM cargo_categories WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Template Configurations (equipment + cargo → excel file)
const templateConfigUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TEMPLATES_DIR),
    filename: (req, file, cb) => {
      // Store as: "{equipment_type} - {cargo_category}.xlsx" matching user's naming style
      const { equipment_type, cargo_category } = req.body;
      cb(null, `${equipment_type} - ${cargo_category}.xlsx`);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(xlsx|xls)$/i)) {
      return cb(new Error('Only Excel files allowed.'), false);
    }
    cb(null, true);
  }
});

app.get('/api/template-configs', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM template_configs ORDER BY equipment_type, cargo_category`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Annotate with whether the file actually exists on disk
    const annotated = rows.map(r => ({
      ...r,
      file_exists: fs.existsSync(path.join(TEMPLATES_DIR, r.template_filename)),
    }));
    res.json(annotated);
  });
});

app.post('/api/template-configs', authenticateToken, isAdmin, (req, res, next) => {
  templateConfigUpload.single('template')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { equipment_type, cargo_category } = req.body;
    if (!equipment_type || !cargo_category) {
      return res.status(400).json({ error: 'equipment_type and cargo_category are required.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Template Excel file is required.' });
    }

    const id = uuidv4();
    const filename = req.file.filename;

    db.run(
      `INSERT INTO template_configs (id, equipment_type, cargo_category, template_filename)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(equipment_type, cargo_category) DO UPDATE SET template_filename=excluded.template_filename, created_at=CURRENT_TIMESTAMP`,
      [id, equipment_type, cargo_category, filename],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ id, equipment_type, cargo_category, template_filename: filename, success: true });
      }
    );
  });
});

app.delete('/api/template-configs/:id', authenticateToken, isAdmin, (req, res) => {
  db.get(`SELECT * FROM template_configs WHERE id = ?`, [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Config not found.' });
    // Remove the file from disk
    const filePath = path.join(TEMPLATES_DIR, row.template_filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.run(`DELETE FROM template_configs WHERE id = ?`, [req.params.id], () => {
      res.json({ success: true });
    });
  });
});

// Legacy template status endpoint (kept for compatibility)
app.get('/api/templates', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM template_configs`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const status = {};
    rows.forEach(r => { status[`${r.equipment_type}_${r.cargo_category}`] = true; });
    res.json(status);
  });
});

// 6. USER MANAGEMENT ROUTES
app.get('/api/users', authenticateToken, isAdmin, (req, res) => {
  db.all(`SELECT id, email, full_name, role, created_at FROM profiles ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/admin/create-user', authenticateToken, isAdmin, async (req, res) => {
  const { email, fullName, password, role } = req.body;
  const id = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);
  
  db.run(`INSERT INTO profiles (id, email, password, full_name, role, force_password_change) 
          VALUES (?, ?, ?, ?, ?, ?)`, 
          [id, email, hashedPassword, fullName, role, 1], (err) => {
    if (err) {
      if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists.' });
      return res.status(500).json({ error: err.message });
    }
    res.json({ id, success: true });
  });
});

app.post('/api/users/:id/role', authenticateToken, isAdmin, (req, res) => {
  const { role } = req.body;
  db.run(`UPDATE profiles SET role = ? WHERE id = ?`, [role, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 7. EXCEL GENERATION
app.post('/api/generate-excel', authenticateToken, async (req, res) => {
  const { so_number, customer_name, etd, equipment_type, dangerous_type, template_config_id } = req.body;

  // Find template: 1) by explicit config id, 2) by DB lookup, 3) smart filesystem scan
  const findTemplatePath = (callback) => {
    if (template_config_id) {
      // User explicitly selected a template config
      db.get(`SELECT * FROM template_configs WHERE id = ?`, [template_config_id], (err, row) => {
        if (row && row.template_filename) {
          const p = path.join(TEMPLATES_DIR, row.template_filename);
          return callback(fs.existsSync(p) ? p : null, row);
        }
        callback(null, null);
      });
    } else {
      // Auto-match by equipment_type + cargo_category
      db.get(
        `SELECT * FROM template_configs WHERE LOWER(equipment_type) = LOWER(?) AND LOWER(cargo_category) = LOWER(?)`,
        [equipment_type, dangerous_type],
        (err, row) => {
          if (row && row.template_filename) {
            const p = path.join(TEMPLATES_DIR, row.template_filename);
            if (fs.existsSync(p)) return callback(p, row);
          }
          // Fallback: smart filesystem keyword scan
          if (fs.existsSync(TEMPLATES_DIR)) {
            const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.xlsx'));
            const equip = (equipment_type || '').toUpperCase();
            const danger = (dangerous_type || '').toUpperCase().replace(/-/g,'').replace(/\s/g,'');
            const match = files.find(f => {
              const name = f.toUpperCase();
              const equipMatch = name.includes(equip);
              const dangerMatch = danger.includes('NON') ? name.includes('NON') : name.includes(danger) && !name.includes('NON');
              return equipMatch && dangerMatch;
            });
            if (match) return callback(path.join(TEMPLATES_DIR, match), null);
          }
          callback(null, null);
        }
      );
    }
  };

  const templatePath = await new Promise(resolve => findTemplatePath((p) => resolve(p)));
  const safeCustomer = (customer_name || 'CUST').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().substring(0, 15);
  const safeEquip = (equipment_type || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const safeDanger = (dangerous_type || '').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
  const fileName = `SO-${so_number}_${safeCustomer}_${safeEquip}-${safeDanger}.xlsx`;
  const exportPath = path.join(EXPORTS_DIR, fileName);

  try {
    const workbook = new ExcelJS.Workbook();

    if (templatePath) {
      // === USE UPLOADED MASTER TEMPLATE ===
      await workbook.xlsx.readFile(templatePath);
      const ws = workbook.getWorksheet(1);

      // Per spec: insert 3 header rows at the very top (Row 1, 2, 3)
      // insertRow shifts existing content down
      ws.spliceRows(1, 0,
        // Row 1: Document title + date
        ['EcoGreen Oleochemicals — Shipment Document', '', `Document Date: ${dayjs().tz('Asia/Jakarta').format('DD MMMM YYYY')}`],
        // Row 2: Customer & SO info
        [`SO Number: ${so_number}`, `Customer: ${customer_name}`, ''],
        // Row 3: ETD & type info
        [`ETD: ${etd}`, `Type: ${equipment_type}`, `Category: ${dangerous_type}`],
      );

      // Style the 3 inserted header rows
      [1, 2, 3].forEach(rowNum => {
        const row = ws.getRow(rowNum);
        row.eachCell({ includeEmpty: true }, (cell, colNum) => {
          if (colNum <= 3 && cell.value) {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004737' } };
            cell.alignment = { vertical: 'middle' };
          }
        });
        row.height = 22;
      });

    } else {
      // === FALLBACK: no template — generate from scratch ===
      workbook.creator = 'EcoGreen Tracking System';
      const ws = workbook.addWorksheet('SO Report');

      ws.mergeCells('A1:F1');
      ws.getCell('A1').value = 'ECOGREEN OLEOCHEMICALS — SHIPMENT ORDER REPORT';
      ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004737' } };
      ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 30;

      const fields = [
        ['SO Number', so_number],
        ['Customer Name', customer_name],
        ['ETD Date', etd],
        ['Equipment Type', equipment_type],
        ['Cargo Category', dangerous_type],
        ['Document Date', dayjs().tz('Asia/Jakarta').format('DD MMMM YYYY HH:mm [WIB]')],
      ];
      ws.getRow(2).values = ['Field', 'Value'];
      ws.getRow(2).font = { bold: true, color: { argb: 'FF004737' } };
      ws.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      fields.forEach((row, i) => {
        ws.getRow(3 + i).values = row;
      });
      ws.getColumn(1).width = 25;
      ws.getColumn(2).width = 40;
      ws.getRow(10).values = ['NOTE', `No master template found for: ${equipment_type} - ${dangerous_type}. Upload via Settings.`];
      ws.getCell('A10').font = { italic: true, color: { argb: 'FFFF6600' } };
    }

    await workbook.xlsx.writeFile(exportPath);

    // Save the generated file path to the database
    db.run(`UPDATE so_records SET generated_excel_path=? WHERE so_number=?`, [exportPath, so_number]);

    res.json({
      downloadUrl: `/api/download/${fileName}`,
      fileName,
      usedTemplate: !!templatePath,
      templateFile: templatePath ? path.basename(templatePath) : null,
    });
  } catch (err) {
    console.error('Excel error:', err);
    res.status(500).json({ error: 'Excel generation failed: ' + err.message });
  }
});



app.get('/api/download/:filename', (req, res) => {
  const filePath = path.join(EXPORTS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found.' });
  res.download(filePath);
});

// ─── CATCH-ALL FRONTEND ROUTING ───────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

// ─── AUTO-PRIORITY CRON JOB (midnight WIB = 17:00 UTC) ───────────────────────
const runPriorityUpdate = () => {
  const todayWIB = dayjs().tz('Asia/Jakarta');
  db.all(`SELECT id, so_number, etd, manual_priority FROM so_records WHERE status='ongoing' AND is_active=1`, [], (err, rows) => {
    if (err) return console.error('Cron error:', err.message);
    rows.forEach(row => {
      if (row.manual_priority) return; // skip manual overrides
      const etd = dayjs.tz(row.etd, 'Asia/Jakarta');
      const diff = etd.diff(todayWIB, 'day');
      const newPriority = diff <= 10 ? 'HIGH' : diff <= 14 ? 'MEDIUM' : 'NORMAL';

      db.get(`SELECT manual_priority FROM so_records WHERE id=?`, [row.id], (e, current) => {
        // Store previous computed priority in a temp field by recalculating
        const oldEtd = dayjs.tz(row.etd, 'Asia/Jakarta');
        const oldDiff = oldEtd.diff(todayWIB.subtract(1, 'day'), 'day');
        const oldPriority = oldDiff <= 10 ? 'HIGH' : oldDiff <= 14 ? 'MEDIUM' : 'NORMAL';

        if (newPriority !== oldPriority) {
          const logId = uuidv4();
          db.run(`INSERT INTO shipment_logs (id, so_id, action, comment, old_data, new_data, updated_by) VALUES (?,?,?,?,?,?,?)`,
            [logId, row.id, 'Auto-Update',
             `Priority auto-updated by system scheduler`,
             JSON.stringify({ priority: oldPriority }),
             JSON.stringify({ priority: newPriority }),
             'System (Cron)'
            ]);
          console.log(`[Cron] SO ${row.so_number}: ${oldPriority} → ${newPriority}`);
        }
      });
    });
  });
};

// Run at midnight WIB (17:00 UTC)
cron.schedule('0 17 * * *', runPriorityUpdate);

// ─── INIT & START ─────────────────────────────────────────────────────────────
initDb().then(() => {
  migrateDb(); // safe ALTER TABLE — never drops data
  app.listen(PORT, () => {
    console.log(`EcoGreen Monolith running on port ${PORT}`);
  });
});
