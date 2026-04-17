# Technical Documentation: EcoGreen Tracking System

## 1. System Overview
The **EcoGreen Tracking System** is a specialized logistics tool designed for tracking Shipment Orders (SO), managing customer-specific requirements, and generating professional Excel reports. It is built as a robust monolithic application serving both the frontend and the backend.

### Key Purpose
- **SO Lifecycle Management**: Tracking shipment status from creation to completion.
- **Automated Prioritization**: Dynamic priority shifting based on Estimated Time of Departure (ETD).
- **Template-Driven Reporting**: Injecting shipment metadata into pre-defined Excel master templates.
- **Audit Trail**: Detailed logging of every modification for accountability.

---

## 2. Technology Stack
- **Frontend**: 
  - **Framework**: React 18 (Vite)
  - **Icons**: Lucide React
  - **Drag & Drop**: @dnd-kit
- **Backend**:
  - **Runtime**: Node.js
  - **Web Framework**: Express.js
  - **Authentication**: JWT (JSON Web Tokens) & BcryptJS
  - **Scheduler**: Node-Cron (Midnight updates)
- **Database**:
  - **Engine**: SQLite3
- **File Handling**:
  - **Excel**: ExcelJS
  - **Uploads**: Multer

---

## 3. Project Structure
The application uses a specific directory structure to ensure data persistence across deployments (especially on shared hosting like Hostinger).

```text
/
├── server.js               # Main Backend Entry Point
├── database.js             # SQLite Schema & Seeding Logic
├── auth.js                 # Authentication Middleware
├── package.json            # Dependencies & Scripts
├── dist/                   # Compiled Frontend (Static Files)
├── /src                    # React Source Code
│   ├── /lib                # API Utilities (apiRequest)
│   ├── /logic              # Frontend Business Logic (Priority/Formatting)
│   └── main.jsx            # Frontend Entry Point
├── /data                   # SQLite Database File (Persistent)
├── /templates              # Excel Master Templates (Persistent)
├── /exports                # Generated Reports (Persistent)
└── /uploads                # User Uploaded Files (Persistent)
```

> [!NOTE]
> Persistent directories like `/data`, `/templates`, and `/exports` are configured to be created automatically at the root level to ensure they are not wiped during subsequent Git deployments.

---

## 4. Database Schema
The system uses SQLite for its simplicity and reliability in local/monolithic environments.

### `profiles`
Manages user accounts, roles, and preferences.
- `id`: UUID (Primary Key)
- `email`: Unique email address
- `password`: Hashed password (Bcrypt)
- `role`: 'admin' or 'user'
- `so_sort_preference`: JSON array for user's custom SO order.

### `so_records`
The core tracking table for Shipment Orders.
- `so_number`: Unique SO identifier.
- `customer_name`: Name of the customer.
- `etd`: Estimated Time of Departure.
- `status`: 'ongoing', 'done', or 'reverted'.
- `manual_priority`: Override for system priority ('HIGH', 'MEDIUM', 'NORMAL').

### `shipment_logs`
Detailed audit trail for every SO.
- `action`: Created, Manual-Update, Auto-Update, Completed, etc.
- `old_data` / `new_data`: JSON snapshots of the record state before and after change.
- `updated_by`: Email or name of the modifier.

### `customers`
Master data for customer requirements.
- `bl_type`: OBL, SWB, etc.
- `tank_requirement`: Specific requirements for tanks.
- `other_requirement`: General notes or special instructions.

---

## 5. Core Logic & Workflows

### 5.1 Excel Generation Flow
The system generates reports using a template-matching algorithm:
1. **Selection**: It searches `/templates` for a file named `{Equipment}_{Category}.xlsx` (e.g., `Container - DG.xlsx`).
2. **Injection**: Metadata (SO Number, Customer Requirements) is injected into the top rows of the worksheet.
3. **Styling**: The system applies conditional styling (Green/Dark Green themes) to the injected header rows using `ExcelJS`.
4. **Export**: The final file is saved to `/exports` and a temporary 24h signed URL is generated for download.

### 5.2 Automated Priority Logic
A cron job runs every night at **00:00 WIB (17:00 UTC)**:
- **HIGH Priority**: ETD is ≤ 10 days from today.
- **MEDIUM Priority**: ETD is ≤ 14 days from today.
- **NORMAL Priority**: ETD is > 14 days from today.
- *Note: Manual priority overrides prevent the system from changing status automatically.*

### 5.3 Authentication
- Uses **JWT** stored in `localStorage` (`ecogreen_token`).
- Token expires in **24 hours**.
- **Admin Role**: Required for template management, user creation, and master data synchronization.

---

## 6. API Reference (Key Endpoints)

| Endpoint | Method | Description | Role |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Authenticate user and receive token. | Public |
| `/api/records` | GET | Fetch active SO records (filtered by role). | Auth |
| `/api/generate-excel` | POST | Generate Excel report from template. | Auth |
| `/api/customers/sync` | POST | Sync local data with Master Customer list. | Admin |
| `/api/template-configs` | POST | Upload/update Excel templates. | Admin |

---

## 7. Configuration & Deployment

### 7.1 Environment Variables (`.env`)
Create a `.env` file in the root with the following:
```bash
PORT=8080
JWT_SECRET=your_secure_secret_key
# Optional: Override persistent paths
PERSISTENT_ROOT=./data
```

### 7.2 Deployment Steps (Fresh Server)
1. **Clone Repository**: `git clone <repo_url>`
2. **Install Deps**: `npm install`
3. **Build Frontend**: `npm run build`
4. **Start Server**: `npm start` (or use PM2: `pm2 start server.js`)

> [!TIP]
> On **Hostinger**, ensure the Node.js application points to `server.js` and the `VITE_` variables are correctly set during the build phase.

---

## 8. Maintenance Guide

### Updating Master Customers
The default customer list is seeded from `database.js` in the `MASTER_CUSTOMERS` array. To update:
1. Edit the array in `database.js`.
2. Login as Admin.
3. Go to **Settings** -> **Sync Master Customers**.

### Managing Excel Templates
Templates are mapped by **Equipment Type** and **Cargo Category**.
1. Navigate to **Admin Settings**.
2. Upload a new `.xlsx` file for a specific combination (e.g., Isotank + Non-DG).
3. The system will automatically use the new file for future generations.

---

## 9. Future Roadmap: SAP Integration
The system is designed to transition into an automated tracker. A dedicated guide is available for the next implementation phase:
- **[SAP Integration Guide](file:///c:/Users/PC/Downloads/customized-tracking-system/SAP_INTEGRATION_GUIDE.md)**: Transitioning from manual input to automated data synchronization with SAP (VBAK/VBAP mapping, OData/RFC patterns).
