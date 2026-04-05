/**
 * seed-customers.js
 * Run once to import all customers from the CSV into the SQLite database.
 * Usage: node seed-customers.js
 */

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db, initDb, migrateDb } = require('./database');

// All customers parsed from uploaded files/Customer Information.csv
// Format: [name, bl_type, combine_bl, shipping_mark_on_bl, tank_requirement, other_requirement]
const CUSTOMERS = [
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

async function seed() {
  console.log('Initializing DB...');
  await initDb();
  migrateDb();

  // small delay to ensure migrations complete
  await new Promise(r => setTimeout(r, 500));

  // Use the admin user as the owner of seeded customers
  const ADMIN_ID = 'admin-system-001';

  let inserted = 0;
  let skipped = 0;

  for (const [name, bl_type, combine_bl, shipping_mark_on_bl, tank_requirement, other_requirement] of CUSTOMERS) {
    await new Promise((resolve) => {
      db.get(`SELECT id FROM customers WHERE LOWER(name) = LOWER(?)`, [name.trim()], (err, existing) => {
        if (existing) {
          // Update existing record with the new fields
          db.run(
            `UPDATE customers SET bl_type=?, combine_bl=?, shipping_mark_on_bl=?, tank_requirement=?, other_requirement=? WHERE id=?`,
            [bl_type || null, combine_bl || null, shipping_mark_on_bl || null, tank_requirement || null, other_requirement || null, existing.id],
            () => {
              console.log(`  ↺ Updated: ${name}`);
              skipped++;
              resolve();
            }
          );
        } else {
          const id = uuidv4();
          db.run(
            `INSERT INTO customers (id, user_id, name, bl_type, combine_bl, shipping_mark_on_bl, tank_requirement, other_requirement)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, ADMIN_ID, name.trim(), bl_type || null, combine_bl || null, shipping_mark_on_bl || null, tank_requirement || null, other_requirement || null],
            (err2) => {
              if (err2) console.error(`  ✗ Error inserting ${name}:`, err2.message);
              else { console.log(`  ✓ Inserted: ${name}`); inserted++; }
              resolve();
            }
          );
        }
      });
    });
  }

  console.log(`\n✅ Done! ${inserted} inserted, ${skipped} updated.`);
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
