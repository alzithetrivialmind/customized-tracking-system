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
const { db, initDb } = require('./database');
const { authenticateToken, isAdmin, JWT_SECRET } = require('./auth');

const app = express();
const PORT = process.env.PORT || 8080;

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const EXPORTS_DIR = path.join(__dirname, 'exports');

// Auto-create required directories
[TEMPLATES_DIR, EXPORTS_DIR, path.join(__dirname, 'uploads')].forEach(dir => {
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
  let sql = `SELECT * FROM so_records WHERE status = ?`;
  let params = [status || 'ongoing'];
  
  if (req.user.role !== 'admin') {
    sql += ` AND user_id = ?`;
    params.push(req.user.id);
  }
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/records', authenticateToken, (req, res) => {
  const { so_number, customer_name, equipment_type, dangerous_type, etd } = req.body;
  const id = uuidv4();
  db.run(`INSERT INTO so_records (id, user_id, so_number, customer_name, equipment_type, dangerous_type, etd) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`, 
          [id, req.user.id, so_number, customer_name, equipment_type, dangerous_type, etd], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Add Initial Log
    const logId = uuidv4();
    db.run(`INSERT INTO shipment_logs (id, so_id, modifier_id, action, comment) VALUES (?, ?, ?, ?, ?)`,
           [logId, id, req.user.id, 'Created', 'Initial SO entry added.'], () => {
      res.json({ id, success: true });
    });
  });
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

// UPDATE SO RECORD
app.put('/api/records/:id', authenticateToken, (req, res) => {
  const { soNumber, customerName, etd, equipmentType, dangerousType, manualPriority, comment } = req.body;
  db.run(
    `UPDATE so_records SET so_number=?, customer_name=?, etd=?, equipment_type=?, dangerous_type=?, manual_priority=? WHERE id=?`,
    [soNumber, customerName, etd, equipmentType, dangerousType, manualPriority || null, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      // Add audit log
      const logId = uuidv4();
      db.run(
        `INSERT INTO shipment_logs (id, so_id, modifier_id, action, comment) VALUES (?, ?, ?, ?, ?)`,
        [logId, req.params.id, req.user.id, 'Record Updated', comment || 'Updated.'],
        () => res.json({ success: true })
      );
    }
  );
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

// 5. TEMPLATE MANAGEMENT ROUTES
app.get('/api/templates', authenticateToken, (req, res) => {
  fs.readdir(TEMPLATES_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Cannot read templates.' });
    const status = {};
    files.forEach(f => {
      const id = f.split('.')[0];
      status[id] = true;
    });
    res.json(status);
  });
});

app.post('/api/templates/:id', authenticateToken, isAdmin, upload.single('template'), (req, res) => {
  res.json({ success: true, message: `${req.params.id} template uploaded.` });
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
  const { so_number, customer_name, etd, equipment_type, dangerous_type } = req.body;
  const templateId = `${equipment_type}_${dangerous_type}`.toUpperCase().replace(/-/g, '_').replace(/ /g, '_');
  const templatePath = path.join(TEMPLATES_DIR, `${templateId}.xlsx`);
  const fileName = `SO_${so_number}_${Date.now()}.xlsx`;
  const exportPath = path.join(EXPORTS_DIR, fileName);

  try {
    const workbook = new ExcelJS.Workbook();
    const hasTemplate = fs.existsSync(templatePath);

    if (hasTemplate) {
      // Use the uploaded master template
      await workbook.xlsx.readFile(templatePath);
      const ws = workbook.getWorksheet(1);
      ws.insertRow(1, []);
      ws.insertRow(1, [`Type: ${equipment_type}`, `Category: ${dangerous_type}`, `Generated: ${new Date().toLocaleString()}`]);
      ws.insertRow(1, [`SO Number: ${so_number}`, `Customer: ${customer_name}`, `ETD: ${etd}`]);
      ws.insertRow(1, ['EcoGreen SO Report']);
    } else {
      // No template uploaded yet — generate a complete report from scratch
      workbook.creator = 'EcoGreen Tracking System';
      workbook.created = new Date();
      const ws = workbook.addWorksheet('SO Report');

      // Header styling
      ws.mergeCells('A1:F1');
      ws.getCell('A1').value = 'ECOGREEN OLEOCHEMICALS — SHIPMENT ORDER REPORT';
      ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004737' } };
      ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 30;

      ws.getRow(2).values = ['Field', 'Value'];
      ws.getRow(2).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FF004737' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      });

      const rows = [
        ['SO Number', so_number],
        ['Customer Name', customer_name],
        ['ETD Date', etd],
        ['Equipment Type', equipment_type],
        ['Cargo Category', dangerous_type],
        ['Generated At', new Date().toLocaleString()],
        ['Generated By', 'EcoGreen Tracking System'],
      ];
      rows.forEach((row, i) => {
        ws.getRow(3 + i).values = row;
        if (i % 2 === 0) {
          ws.getRow(3 + i).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FBF9' } };
          });
        }
      });

      ws.getColumn(1).width = 25;
      ws.getColumn(2).width = 40;

      // Note about missing template
      ws.getRow(12).values = ['NOTE', `No master template uploaded for ${templateId}. Upload via Settings page.`];
      ws.getCell('A12').font = { italic: true, color: { argb: 'FFFF6600' } };
    }

    await workbook.xlsx.writeFile(exportPath);
    res.json({ downloadUrl: `/api/download/${fileName}`, hasTemplate });
  } catch (err) {
    console.error('Excel error:', err);
    res.status(500).json({ error: 'Excel generation failed: ' + err.message });
  }
});


app.get('/api/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'exports', req.params.filename);
  res.download(filePath);
});

// 6. CATCH-ALL FRONTEND ROUTING
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

// INIT & START
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`EcoGreen Monolith running on port ${PORT}`);
  });
});
