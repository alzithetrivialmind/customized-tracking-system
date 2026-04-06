import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { recordId, soNumber, customerName, etd, equipmentType, dangerousType } = req.body;

  try {
    // 1. Identify Template Key
    const templateId = `${equipmentType}_${dangerousType}`.toUpperCase().replace('-', '_').replace(' ', '_');
    
    // 2. Download Template from Supabase Storage
    const { data: templateData, error: downloadError } = await supabase.storage
      .from('templates')
      .download(`${templateId}.xlsx`);

    if (downloadError) throw new Error(`Template ${templateId} not found in storage.`);

    // 3. Load into ExcelJS in-memory
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await templateData.arrayBuffer();
    await workbook.xlsx.load(Buffer.from(arrayBuffer));
    
    const worksheet = workbook.getWorksheet(1);

    // 4. Inject Metadata (Prepend 4 Rows)
    // Using empty strings for columns A and B so the data goes into Column C.
    worksheet.insertRow(1, ['', '', 'GENERATED REPORT - ECOGREEN SO TRACKING']);
    worksheet.insertRow(2, ['', '', `SO Number: ${soNumber} | Customer: ${customerName} | ETD: ${etd}`]);
    worksheet.insertRow(3, ['', '', `Type: ${equipmentType} | Category: ${dangerousType} | Generated At: ${new Date().toLocaleString()}`]);
    worksheet.insertRow(4, []); // Empty spacing row

    // Styling the first row
    worksheet.getRow(1).font = { bold: true, size: 14, color: { argb: '004737' } };
    worksheet.getRow(2).font = { bold: true };
    worksheet.getRow(3).font = { bold: true };

    // 5. Save back to Buffer
    const resultBuffer = await workbook.xlsx.writeBuffer();

    // 6. Upload Result to 'exports' bucket
    const fileName = `SO_${soNumber}_${Date.now()}.xlsx`;
    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(fileName, resultBuffer, { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    if (uploadError) throw uploadError;

    // 7. Get Signed URL for Download (Valid for 1 hour)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('exports')
      .createSignedUrl(fileName, 3600);

    if (urlError) throw urlError;

    return res.status(200).json({ success: true, downloadUrl: signedUrl.signedUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
