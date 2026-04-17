# SAP Integration Guide: Transitioning to Automated Tracking

## 1. Executive Summary
This document outlines the strategic and technical roadmap for integrating the **EcoGreen Tracking System** with **SAP**. The end goal is to transition the application from a manual checklist system into a **Pure Tracker System**, where all shipment metadata is automatically fetched from SAP (System of Record).

---

## 2. Integration Architecture
The system will shift from a "Push" (Manual Input) model to a "Pull" or "Sync" model. 

### Current vs. Future State
- **Current**: Users manually enter SO Number, Customer Name, ETD, etc.
- **Future**: User enters an SO Number, and the application fetches all related data (Customer, LSP, Contract, Instructions) directly from SAP.

### Recommended Logic Flow
1. **Trigger**: User enters SO Number in the dashboard.
2. **Fetch**: Node.js backend calls an SAP BAPI or OData Service.
3. **Map**: Fields like `VBELN` are mapped to local database columns.
4. **Persist**: Data is saved to the local `so_records` table to ensure offline availability and tracking history.

---

## 3. SAP Entity Mapping
To transition to an automated system, the following SAP tables/objects should be targeted:

| EcoGreen Field | SAP Table / Field | Description |
| :--- | :--- | :--- |
| **Sales Order** | `VBAK-VBELN` | The primary key for the shipment. |
| **Sales Contract** | `VBAK-VGBEL` | Linked contract/agreement reference. |
| **Customer Name** | `KNA1-NAME1` | Master customer name via `VBAK-KUNNR`. |
| **ETD (Estimate)** | `VBAK-EDATU` | Requested delivery/shipment date. |
| **LSP (Forwarder)** | `VPA-PERNR` | Partner Function 'SP' (Forwarder) in the SO. |
| **Shipping Instr.** | `STXH` / `STXL` | Header Texts (Text ID: '0001', '0002', etc.). |
| **Equipment Type** | `MARA-MEINS` | Material master / Unit of Measure. |
| **Cargo Category** | `MARA-PROFL` | Dangerous goods indicator / classification. |

---

## 4. Connection Methods

### 4.1 OData & SAP Gateway (Modern)
Using SAP standard OData services is the most flexible approach for a Node.js environment.
- **Example Fetch**:
```javascript
const axios = require('axios');

async function getSAPOrder(soNumber) {
  const sapUrl = `https://sap-gateway.ecogreen.com/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder('${soNumber}')`;
  const response = await axios.get(sapUrl, {
    auth: { username: 'SAP_USER', password: 'SAP_PASSWORD' }
  });
  return response.data.d;
}
```

### 4.2 RFC via `node-rfc` (Direct ABAP Call)
If direct calls to ABAP Function Modules are required, use the `node-rfc` library.
- **Requirement**: SAP NW RFC SDK (C++ binaries) must be installed on the server.
- **Example Call**:
```javascript
const { Client } = require('node-rfc');

const client = new Client({ dest: "SAP_SYSTEM" });

async function callBapi(soNumber) {
  await client.open();
  const result = await client.call("BAPI_SALESORDER_GETDETAILEDLIST", {
    SALES_ORDERS: [{ VBELN: soNumber }]
  });
  return result;
}
```

---

## 5. Transition Roadmap

### Phase 1: Hybrid Mode
- Allow manual input but add a "Sync from SAP" button next to the SO Number field.
- Map the most critical fields (Customer, ETD) first.

### Phase 2: Schema Expansion
- Update the `so_records` table to include:
  - `contract_number` (VARCHAR)
  - `lsp_name` (VARCHAR)
  - `shipping_instructions` (TEXT)

### Phase 3: Pure Tracker
- Disable all manual input fields in the UI.
- The "Create New SO" form becomes a single input for SO Number.
- Successfully fetching from SAP automatically populates the entire record.

---

## 6. Technical Recommendations
> [!IMPORTANT]
> **Data Integrity**: Ensure that SAP field `ERDAT` (Created Date) and `AEDAT` (Changed Date) are synced to detect if a record has changed in SAP since the last fetch.
> [!CAUTION]
> **Performance**: Use OData `$select` and `$expand` operators to fetch only the necessary fields to reduce latency during the tracking update.
