const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// MASTER CUSTOMER DATA (From Customer Information.csv)
const MASTER_CUSTOMERS = [
  ["A&A FRATELLI PARODI", "OBL", "", "NO", "NO NEED TO CHECK", "CUSTOMER MUST CONFIRM SCHEDULE BEFORE SHIPMENT"],
  ["ASTRA POLIMER", "SWB", "", "NO", "", ""],
  ["AZELIS BENELUX", "SWB", "", "NO", "", "INPUT ARTICLE NO IN ALL SHIP.DOC\nSEND INVOICE BY EMAIL, INVOICE REQUIRE SIGN AND STAMP"],
  ["AZELIS DENMARK", "SWB", "", "NO", "", "SEND INVOICE BY EMAIL"],
  ["AZELIS FRANCE", "SWB", "", "NO", "KOSHER/HALAL", "Sebelum proses PO, re-confirm ke Bu Bellah apakah orderan ini utk L'OREAL ATAU BUKAN, AZELIS-LOREAL harus kirim original PO ke bu Bellah untuk reconfirm harga\nINPUT ARTICLE NO IN ALL SHIP.DOC\nSEND INVOICE BY EMAIL"],
  ["BOSS CHEMIE", "SWB", "", "NO", "", ""],
  ["BASF SCHWEIZ AG", "SWB", "", "", "KOSHER / HALAL", "1.SEND INVOICE & COA BY EMAIL\n2.PO NO IN KOSHER CERT FOR ISOTANK"],
  ["BASF PERSONAL CARE", "SWB", "", "NO", "KOSHER/HALAL", "1.KOSHER CERT\n2.SEND INVOICE BY EMAIL"],
  ["BIOSYNTHIS", "SWB", "", "NO", "KOSHER/HALAL", "1.KOSHER CERT\n2.SEND INVOICE BY EMAIL"],
  ["Chemische Fabrik Schärer & Schläpfer AG", "SWB", "", "NO", "", "1. DRUM WITH NEW PACKAGING (YELLOW STRAP WITH NO PLASTIC WRAPPING)"],
  ["CHP CARBOHYDRATE", "OBL", "", "YES", "", ""],
  ["CHEMIX SA", "SWB", "", "YES", "", "1. DRUM WITH NEW PACKAGING (YELLOW STRAP WITH NO PLASTIC WRAPPING)"],
  ["CORCORAN IRELAND", "SWB", "", "NO", "", "REQUIRE FORM A"],
  ["CORCORAN UK", "SWB", "", "NO", "", ""],
  ["CRODA EUROPE (UK)", "SWB", "", "NO", "KOSHER/HALAL", "1. Tank with larger heating surface (> 10 m2) required as this is high heat cargo\n2. Do not use BULKHAUL or HUKTRA to ship\n3. INPUT ARTICLE AND MATERIAL CODE ON ALL SHIP.DOC\n4. Combine BL can be acceptable (subject with customer acceptance)\n5. Material and Article Code in all documents\n6. MAX NW: 19MT PER ISOTANK\n7. Send invoice by email"],
  ["CRODA CHOCQUES SAS", "SWB", "", "NO", "", ""],
  ["CRODA IBERICA SPAIN", "SWB", "", "NO", "KOSHER/HALAL", "1.Send invoice by email\n2.NEED KOSHER CERT\n3. CRODA ACCEPT DRUM NEW PACKAGING (YELLOW STRAP WITH NO PLASTIC WRAPPING)"],
  ["CHT GERMANY GMBH", "SWB", "", "", "", ""],
  ["CVH CHEMIE", "SWB", "", "NO", "", ""],
  ["DERMOCHIMICA", "SWB", "", "", "", "1.SHIPMENT DATE STATED ON SC & PI, NEED TO FOLLOW SHIPMENT DATE ON SCHEDULE GIVEN TO CUST.\n2. NEED INVOICE DATE TO BE THE DATE WE SEND THE REVISE PI\n3. NEED BL DRAFT CONFIRMATION FROM CUST\n4.REQ PRE SAMPLE (NO NEED CUST APPROVAL), SENDING SAMPLE CLOSE TO ETD BATAM DATE"],
  ["DIA CHEMICAL", "SWB", "", "NO", "", "1. 14 FREE DAYS @ POD (COMBINE)\n2. SWITCH BL (MAKE SURE THEY KNOW THE FEE IS UNDER DIA CHEM)\n3. DTHC BILLED TO DIA CHEM AND INVOICE FROM CARRIER SHOULD INDICATE BANK CHARGES\n4. SURRENDER BL IS ACCEPTABLE"],
  ["DHW", "SWB", "", "NO", "SPECIAL REQUIREMENT", "1. PRICE IS SUBJECT TO CHANGE MONTHLY\n2. INVOICE EOS SIGNED MANUALLY BY FINANCE FOR ANTI-LUMPING PRODUCTS\n3. CIP, Please bill all destination charges to EOS (SEND INVOICE BY EMAIL)"],
  ["FACI ECHEM", "SWB", "", "NO", "", ""],
  ["E&S CHIMIE", "SWB", "", "NO", "KOSHER/HALAL", ""],
  ["EOG", "SWB", "", "NO", "WAX B PERLU CEK KOSHER/HALAL", "CIP, Please bill all destination charges to EOS, DTHC included except inspection charges"],
  ["ELITAS", "SWB", "", "NO", "WAX B PERLU CEK KOSHER/HALAL", "1.PLEASE INPUT PI NO. IN EOS INVOICE, TO SHIP ISOTANK SEPARATELY\n2.SEND CUST BL DRAFT FOR CONFIRMATION"],
  ["EPSON TELFORD", "SWB", "", "NO", "", "SINGLE LAYER PALLET ONLY, WHEN BOOKING PLS MENTION NO ROLLED SHIPMENT"],
  ["ETERNIS FINE CHEMICALS UK", "SWB", "", "NO", "KOSHER/HALAL BASED ON ETERNIS'S LIST", "1. Send invoice by email\n2. Send CC & COA by email\n3. Tank harus di approved by Eternis"],
  ["EUROBIO LAB", "SWB", "", "YES", "", "1. NO NEED SCHEDULE CONFIRMATION"],
  ["GOLDEN AGRI INTERNATIONAL", "OBL", "", "NO", "FOSFA", "Apabila pembelian melalui EMERALD/Trader, ada komisi untuk trader USD 10\nDRAFT BL CHECK WITH CUSTOMER, DOCUMENT SEND TO DBS BANK JAKARTA, RECHECK SELLING PRICE SUDAH INCLUDE LEVY DUTY/BELUM"],
  ["HDS CHEMIE", "OBL", "", "NO", "", "BEFORE CONFIRM BL, NEED CUSTOMER CONFIRMATION\nBEFORE SEND HARDCOPY VIA DHL, NEED CUSTOMER CONFIRMATION"],
  ["INDUSTRIA CHIMICA PANZERI", "SWB", "", "NO", "NO NEED TO CHECK", ""],
  ["INTER-HARZ GMBH", "SWB", "", "", "NO NEED TO CHECK", "1.LABEL STANDARD FOR POD DOUALA, CAMEROON\n2. REQUIRE FRESH PALLET (STATE IN REQ TO PSPA & SHIPPING INST)"],
  ["ITALMATCH", "SWB", "", "NO", "NO NEED TO CHECK", "1.EOS INVOICE NEEDS TO BE STAMPED & SIGNED\n2.NEED TO DECLARE BL NW = GW"],
  ["KA INGREDIENTS", "OBL", "", "YES", "", ""],
  ["KALE KIMYA", "SWB", "", "NO", "", ""],
  ["LAB. MAVERICK", "SWB", "", "NO", "", "PLEASE MAKE SURE TO INPUT REQUIREMENT 'FOOD GRADE CONTAINER - EXTERNAL & INTERNAL' WHILE PLACING A BOOKING AND CREATE BC\nEN 128 BARCODE ON EACH PALLET"],
  ["LANXESS UK", "SWB", "", "", "KOSHER/HALAL NEED TO CHECK BY KLBD TANKERS", "Send invoice by email"],
  ["LEVACO", "SWB", "", "YES", "", "Send invoice by email"],
  ["LUSH UK", "SWB", "", "NO", "", "MUST INCLUDE IN INVOICE 'NOT FOR HUMAN CONSUMPTION - COSMETIC INGREDIENT'"],
  ["LIMSA", "SWB", "YES", "NO", "", "1. Sebelum proses PO, re-confirm ke Bu Bellah apakah orderan ini utk L'OREAL ATAU BUKAN\n2. Untuk Orderan Loreal di Remarks SO harus tulis \"L'OREAL\"\n3. Send Invoice by Email"],
  ["MARVESA", "OBL", "", "", "", "1.DOC SEND TO OCBC PALMSPRING\n2. DRAFT BL CHECK BY CUSTOMER"],
  ["MARPOL PARLATICI", "SWB", "", "NO", "WAX B PERLU CEK KOSHER/HALAL", "NEED TO SEND DOC DRAFT TO CUST"],
  ["MBP SOLUTION", "OBL", "", "NO", "", "1. REQ TO PSPA DI SAP HARUS MENGIKUTI COA YG DI APPROVED DARI MARKETING KE CUST.\n2. REQUIRE STAMP & SIGN ON PI\n3.SEND SAMPLE EACH CONTAINER (ONCE PAYMENT RECEIVED & CLOSE TO ETD BATAM)\n4.BL DETAILS W/ BATCH NO, MANUFACTURING & EXPIRY DATE\n5.DOC DRAFT NEED TO BE SEND TO CUST\n6.DO NOT SHOW SHIPPING MARK WHICH STATED WORD PALM"],
  ["MIG SYSTEMS", "SWB", "", "NO", "", ""],
  ["MONOCHEM", "OBL", "", "YES", "", ""],
  ["MOSSELMAN", "OBL", "", "NO", "KOSHER/HALAL", "NEUTRAL BAGS, MARKING WITHOUT ECOGREEN & MUI LOGO, IF ROMULGIN GTCC (ISOTANK) NEED FOOD GRADE ISOTANK\n1 PO 1 DOC"],
  ["NiMAC UK", "SWB", "", "NO", "", ""],
  ["NiMAC GMBH", "SWB", "", "NO", "", ""],
  ["OLEON NV", "SWB", "", "NO", "FOSFA / KOSHER / NOBL", "1. DO NOT USE HMM & YML\n2. 21 FREE DAYS AT POD\n3. MAX LOADING: 20 MT/ISOTANK\n4. Invoice send by DHL\n5. ETA POD 1 week earlier than requested"],
  ["OQEMA UAB", "SWB", "", "NO", "", ""],
  ["OY CELEGO", "SWB", "", "NO", "", "Send invoice by email"],
  ["PULCRA", "SWB", "", "YES", "KOSHER / HALAL", ""],
  ["SABO", "SWB", "", "", "NO NEED TO CHECK", "Send invoice by email"],
  ["SASOL GERMANY", "SWB", "", "NO", "KOSHER / HALAL", "NEED KOSHER CERT"],
  ["SARCHEM KIMYA", "SWB", "", "NO", "", ""],
  ["SEPPIC", "SWB", "", "NO", "NO NEED TO CHECK", ""],
  ["STEPAN UK", "SWB", "", "NO", "", "1. OLD DRUM PACKAGING (CORD STRAP & PLASTIC WRAPPING)"],
  ["STOCKMEIER CHEMIE", "SWB", "YES", "NO", "", "1.MAX 2 FCLS ON 1 BL & 1 MV\n2.Send invoice by email"],
  ["STOCKMEIER CHEMIA", "SWB", "", "NO", "", ""],
  ["STOCKMEIER POLSKA", "SWB", "", "NO", "", ""],
  ["SCHILL + SEILACHER GMBH", "SWB", "", "YES", "", ""],
  ["SYSKEM CHEMIE", "SWB", "", "", "", "1. DRUM WITH NEW PACKAGING (YELLOW STRAP WITH NO PLASTIC WRAPPING)"],
  ["STEARINERIE DUBOIS FILS", "SWB", "", "NO", "", "DOC DRAFT FOR CUSTOMER APPROVAL"],
  ["SYMRISE GRANADA", "SWB", "", "YES", "", "Invoice & PL need to add 'IBCs are reusable'"],
  ["UNILEVER PMT", "SWB", "", "NO", "", ""],
  ["VAN WIJK", "OBL", "", "NO", "FOSFA / NOBL", "Apabila pembelian melalui EMERALD/Trader, ada komisi untuk trader USD 10\nFOR PKFAD PRODUCT >> NEED TO SEND SAMPLE"],
  ["WIN COSMETIC", "SWB", "", "NO", "", ""],
  ["YIGITOGLU", "OBL", "", "YES", "", "1.ONE PO SHOULD HAS ONE SHIPMENT DATE (DO NOT SPLIT THE SHIPMENT DATE)\n2.1 PO 1 DOC\n3.CUSTOMER NEED TO CONFIRM SHIPPING DOC BEFORE DISPATCH TO BANK"],
  ["ZSCHIMMER & SCHWARZ ITALIANA", "SWB", "", "YES", "", "IN CASE 1 CONTAINER CONTAIN MORE THAN 1 PRODUCT, EACH PRODUCT MUST BE POSITIONED NEAR CONTAINER DOOR"],
  ["ZSCHIMMER GMBH", "SWB", "", "", "NO NEED TO CHECK", ""],
];

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

      // 4. AUTO-SEED CUSTOMERS IF EMPTY
      db.get(`SELECT COUNT(*) as count FROM customers`, [], (err, row) => {
        if (!err && row && row.count === 0) {
          console.log('Automated Seeding: Populating master customer list...');
          seedCustomers('admin-system-001');
        }
      });

      resolve();
    });
  });
};

const seedCustomers = async (adminId = 'admin-system-001') => {
  return new Promise((resolve) => {
    let completed = 0;
    MASTER_CUSTOMERS.forEach(([name, bl, comb, ship, tank, other]) => {
      db.run(
        `INSERT OR REPLACE INTO customers (id, user_id, name, bl_type, combine_bl, shipping_mark_on_bl, tank_requirement, other_requirement) 
         VALUES ((SELECT id FROM customers WHERE LOWER(name) = LOWER(?)), ?, ?, ?, ?, ?, ?, ?)`,
        [name.trim(), adminId, name.trim(), bl || null, comb || null, ship || null, tank || null, other || null],
        (err) => {
          if (err) console.error(`Error seeding ${name}:`, err.message);
          completed++;
          if (completed === MASTER_CUSTOMERS.length) {
            console.log(`✅ Successfully synced ${MASTER_CUSTOMERS.length} master customers.`);
            resolve();
          }
        }
      );
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

module.exports = { db, initDb, migrateDb, seedCustomers };
