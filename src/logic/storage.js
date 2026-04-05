import { get, set, del, keys } from 'idb-keyval';

export const STORAGE_KEYS = {
  RECORDS: 'eg_records',
  CUSTOMERS: 'eg_customers',
  EQUIPMENT_TYPES: 'eg_equip_types',
  DANGEROUS_TYPES: 'eg_danger_types',
  TEMPLATES: 'eg_templates', // Store as { id: blob }
  SETTINGS: 'eg_settings'
};

// Initial Data
const DEFAULT_EQUIPMENT = ['Container', 'Isotank'];
const DEFAULT_DANGER = ['DG', 'NON-DG'];

export const initializeDB = async () => {
  const existingEquip = await get(STORAGE_KEYS.EQUIPMENT_TYPES);
  if (!existingEquip) await set(STORAGE_KEYS.EQUIPMENT_TYPES, DEFAULT_EQUIPMENT);

  const existingDanger = await get(STORAGE_KEYS.DANGEROUS_TYPES);
  if (!existingDanger) await set(STORAGE_KEYS.DANGEROUS_TYPES, DEFAULT_DANGER);

  const existingCustomers = await get(STORAGE_KEYS.CUSTOMERS);
  if (!existingCustomers) await set(STORAGE_KEYS.CUSTOMERS, []);

  const existingRecords = await get(STORAGE_KEYS.RECORDS);
  if (!existingRecords) await set(STORAGE_KEYS.RECORDS, []);
};

export const getAllRecords = () => get(STORAGE_KEYS.RECORDS);
export const saveRecords = (records) => set(STORAGE_KEYS.RECORDS, records);

export const getAllCustomers = () => get(STORAGE_KEYS.CUSTOMERS);
export const saveCustomers = (customers) => set(STORAGE_KEYS.CUSTOMERS, customers);

export const getEquipmentTypes = () => get(STORAGE_KEYS.EQUIPMENT_TYPES);
export const saveEquipmentTypes = (types) => set(STORAGE_KEYS.EQUIPMENT_TYPES, types);

export const getDangerousTypes = () => get(STORAGE_KEYS.DANGEROUS_TYPES);
export const saveDangerousTypes = (types) => set(STORAGE_KEYS.DANGEROUS_TYPES, types);

export const getTemplate = (id) => get(`${STORAGE_KEYS.TEMPLATES}_${id}`);
export const saveTemplate = (id, blob) => set(`${STORAGE_KEYS.TEMPLATES}_${id}`, blob);

// Logger Helper
export const createLogEntry = (user, action, details, comment, attachment = null) => ({
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  user: user || 'System',
  action,
  details,
  comment,
  attachment // { name, type, data (base64/blob) }
});
