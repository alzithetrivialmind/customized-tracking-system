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

// 7. EXCEL GENERATION (Monolithic Version)
app.post('/api/generate-excel', authenticateToken, async (req, res) => {
  const { so_number, customer_name, etd, equipment_type, dangerous_type } = req.body;
  const templateId = `${equipment_type}_${dangerous_type}`.toUpperCase().replace('-', '_').replace(' ', '_');
  
  const TEMPLATES_DIR = path.join(__dirname, 'templates');
  const EXPORTS_DIR = path.join(__dirname, 'exports');
  const templatePath = path.join(TEMPLATES_DIR, `${templateId}.xlsx`);
  const fileName = `SO_${so_number}_${Date.now()}.xlsx`;
  const exportPath = path.join(EXPORTS_DIR, fileName);

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.getWorksheet(1);

    worksheet.insertRow(1, ['GENERATED REPORT - ECOGREEN SO TRACKING']);
    worksheet.insertRow(2, [`SO Number: ${so_number}`, `Customer: ${customer_name}`, `ETD: ${etd}`]);
    worksheet.insertRow(3, [`Type: ${equipment_type}`, `Category: ${dangerous_type}`, `Generated At: ${new Date().toLocaleString()}`]);
    worksheet.insertRow(4, []);

    await workbook.xlsx.writeFile(exportPath);
    res.json({ downloadUrl: `/api/download/${fileName}` });
  } catch (err) {
    res.status(500).json({ error: 'Excel Generation Failed: ' + err.message });
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
