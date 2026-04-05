const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// 1. PATH RESOLUTION
const DB_DIR = path.join(__dirname, 'database');
const DB_PATH = path.join(DB_DIR, 'ecogreen.db');

// Ensure directory exists (Git ignores empty folders)
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database at:', DB_PATH);
  }
});

const initDb = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      // 2. CREATE TABLES
      // PROFILES
      db.run(`CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        role TEXT DEFAULT 'user',
        force_password_change INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // CUSTOMERS
      db.run(`CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES profiles (id)
      )`);

      // SO RECORDS
      db.run(`CREATE TABLE IF NOT EXISTS so_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        so_number TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        equipment_type TEXT NOT NULL,
        dangerous_type TEXT NOT NULL,
        etd DATE NOT NULL,
        status TEXT DEFAULT 'ongoing',
        manual_priority TEXT DEFAULT NULL,
        completed_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES profiles (id)
      )`);

      // SHIPMENT LOGS
      db.run(`CREATE TABLE IF NOT EXISTS shipment_logs (
        id TEXT PRIMARY KEY,
        so_id TEXT NOT NULL,
        modifier_id TEXT,
        action TEXT NOT NULL,
        details TEXT,
        comment TEXT NOT NULL,
        attachment_url TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (so_id) REFERENCES so_records (id) ON DELETE CASCADE,
        FOREIGN KEY (modifier_id) REFERENCES profiles (id)
      )`);

      // 3. SEED INITIAL ADMIN (Optional/Recommended)
      const adminEmail = 'admin@ecogreen.com';
      db.get(`SELECT id FROM profiles WHERE email = ?`, [adminEmail], async (err, row) => {
        if (!row) {
          const hashedPassword = await bcrypt.hash('admin123', 10);
          const adminId = 'admin-system-001';
          db.run(`INSERT INTO profiles (id, email, password, full_name, role, force_password_change) 
                  VALUES (?, ?, ?, ?, ?, ?)`, 
                  [adminId, adminEmail, hashedPassword, 'System Administrator', 'admin', 1], (err) => {
            if (err) console.error('Error seeding admin:', err.message);
            else console.log('Initial Admin seeded: admin@ecogreen.com / admin123');
          });
        }
      });

      resolve();
    });
  });
};

module.exports = { db, initDb };
