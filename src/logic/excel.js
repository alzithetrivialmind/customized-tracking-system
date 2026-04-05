import * as XLSX from 'xlsx';

/**
 * 
 * @param {Blob} templateBlob - The original Excel master file.
 * @param {Object} data - { createdAt, customerName, etd }
 * @returns {Blob} - The modified Excel file.
 */
export const generateExcelWithHeaders = async (templateBlob, record) => {
  const dataArray = await templateBlob.arrayBuffer();
  const workbook = XLSX.read(dataArray, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Helper to prepend rows
  // Since SheetJS doesn't have a simple "insert row at top", we shift data or create a new sheet.
  // Actually, for "simple headers", we can create a new worksheet and copy the old one starting at row 4.
  
  const originalJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  const headers = [
    ['Document Created Date:', record.createdAt || new Date().toISOString().split('T')[0]],
    ['Customer Name:', record.customerName],
    ['ETD Date (Shipment):', record.etd],
    [], // Empty row separator
  ];

  const newContent = [...headers, ...originalJson];
  const newWorksheet = XLSX.utils.aoa_to_sheet(newContent);
  
  const newWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, firstSheetName);

  const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
