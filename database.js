const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// DB_PATH must live OUTSIDE the project/nodejs folder so it survives re-deployments.
// Priority: 1. DB_PATH env var  2. One level up from __dirname (parent of nodejs/)
const DB_DIR = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(__dirname, '..', 'data');   // e.g. .../domains/.../data/

const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, 'ecogreen.db');

// Ensure the directory exists
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
        bl_type TEXT DEFAULT NULL,
        combine_bl TEXT DEFAULT NULL,
        shipping_mark_on_bl TEXT DEFAULT NULL,
        tank_requirement TEXT DEFAULT NULL,
        other_requirement TEXT DEFAULT NULL,
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

      // EQUIPMENT TYPES (dynamic, admin-managed)
      db.run(`CREATE TABLE IF NOT EXISTS equipment_types (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // CARGO CATEGORIES (dynamic, admin-managed)
      db.run(`CREATE TABLE IF NOT EXISTS cargo_categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // TEMPLATE CONFIGURATIONS (equipment + cargo → excel file)
      db.run(`CREATE TABLE IF NOT EXISTS template_configs (
        id TEXT PRIMARY KEY,
        equipment_type TEXT NOT NULL,
        cargo_category TEXT NOT NULL,
        template_filename TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(equipment_type, cargo_category)
      )`);

      // SEED DEFAULT EQUIPMENT TYPES
      const defaultEquip = ['Container', 'Isotank', 'Flexitank'];
      defaultEquip.forEach(name => {
        db.run(`INSERT OR IGNORE INTO equipment_types (id, name) VALUES (?, ?)`, [name.toLowerCase().replace(/\s+/g,'-'), name]);
      });

      // SEED DEFAULT CARGO CATEGORIES
      const defaultCargo = ['DG', 'NON-DG'];
      defaultCargo.forEach(name => {
        db.run(`INSERT OR IGNORE INTO cargo_categories (id, name) VALUES (?, ?)`, [name.toLowerCase().replace(/\s+/g,'-'), name]);
      });

      resolve();
    });
  });
};

// Safe migration: adds new columns to existing tables without dropping data.
// SQLite doesn't support IF NOT EXISTS for columns, so we catch the "duplicate column" error.
const migrateDb = () => {
  const addColumn = (table, column, definition) => {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error(`Migration error (${table}.${column}):`, err.message);
      }
    });
  };

  // so_records: new columns per spec
  addColumn('so_records', 'is_active', 'INTEGER DEFAULT 1');
  addColumn('so_records', 'generated_excel_path', 'TEXT DEFAULT NULL');
  addColumn('so_records', 'notes', 'TEXT DEFAULT NULL');
  addColumn('so_records', 'template_config_id', 'TEXT DEFAULT NULL');

  // shipment_logs: old/new data snapshots + updated_by
  addColumn('shipment_logs', 'old_data', 'TEXT DEFAULT NULL');
  addColumn('shipment_logs', 'new_data', 'TEXT DEFAULT NULL');
  addColumn('shipment_logs', 'updated_by', 'TEXT DEFAULT NULL');
  addColumn('shipment_logs', 'attachment_path', 'TEXT DEFAULT NULL');

  // customers: extended fields
  addColumn('customers', 'bl_type', 'TEXT DEFAULT NULL');
  addColumn('customers', 'combine_bl', 'TEXT DEFAULT NULL');
  addColumn('customers', 'shipping_mark_on_bl', 'TEXT DEFAULT NULL');
  addColumn('customers', 'tank_requirement', 'TEXT DEFAULT NULL');
  addColumn('customers', 'other_requirement', 'TEXT DEFAULT NULL');
};

module.exports = { db, initDb, migrateDb };
