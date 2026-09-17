import { DocumentAttachment, ImageAttachment } from '../types';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatThaiDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = d.getFullYear() + 543; // Buddhist Era
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year} ${hours}:${minutes} น.`;
  } catch {
    return dateStr;
  }
}

export function formatSimpleDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
  } catch {
    return dateStr;
  }
}

/**
 * Real client-side file downloader.
 * If file has actual data/URL, downloads it.
 * If sample file without binary content, generates a realistic formatted file Blob.
 */
export function triggerFileDownload(doc: DocumentAttachment) {
  if (doc.contentData && doc.contentData.startsWith('data:')) {
    // Data URL (e.g. user uploaded file)
    const a = document.createElement('a');
    a.href = doc.contentData;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Generate realistic downloadable content based on extension
  let mimeType = 'text/plain';
  let blobContent: BlobPart = '';

  const ext = doc.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'csv' || ext === 'xlsx') {
    mimeType = 'text/csv;charset=utf-8;';
    blobContent = `\uFEFFรหัสงาน,ชื่องาน,ผู้รับผิดชอบ,สถานะ,วันที่จัดทำ\nPRJ-TASK,${doc.name},ทีมผู้เชี่ยวชาญโครงการ,เสร็จสมบูรณ์,${new Date().toISOString()}\n`;
  } else if (ext === 'html' || ext === 'htm') {
    mimeType = 'text/html;charset=utf-8;';
    blobContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${doc.name}</title></head><body><h1>เอกสารโครงการ: ${doc.name}</h1><p>จัดทำโดยระบบติดตามโครงการ วันที่: ${new Date().toLocaleString('th-TH')}</p></body></html>`;
  } else if (ext === 'pdf') {
    // Simple text-based representation or downloadable document
    mimeType = 'application/pdf';
    // Fallback printable text / HTML view wrapped or text note
    const fileNotice = `%PDF-1.4\n% เอกสารโครงการ: ${doc.name}\n1 0 obj\n<< /Title (${doc.name}) /Author (ระบบติดตามโครงการ) >>\nendobj\n%%EOF`;
    blobContent = fileNotice;
  } else {
    mimeType = 'text/plain;charset=utf-8;';
    blobContent = `=== เอกสารโครงการ: ${doc.name} ===\nรหัสเอกสาร: ${doc.id}\nวันที่อัปโหลด: ${doc.uploadedAt}\nผู้จัดทำ: ${doc.uploadedBy}\nขนาดไฟล์: ${formatFileSize(doc.size)}\n\n(เนื้อหาเอกสารถูกสร้างจากระบบติดตามงานโครงการอัตโนมัติ)`;
  }

  const blob = new Blob([blobContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads an image directly to the user device
 */
export function triggerImageDownload(img: ImageAttachment) {
  const a = document.createElement('a');
  a.href = img.url;
  a.download = img.name || 'project-image.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function detectFileType(fileName: string): DocumentAttachment['fileType'] {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'docx';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xlsx';
  if (['zip', 'rar', '7z'].includes(ext)) return 'zip';
  if (['txt', 'md', 'json'].includes(ext)) return 'txt';
  return 'other';
}

/**
 * Export Milestone & Sub-tasks data to an Excel-compatible CSV file with UTF-8 BOM
 */
export function exportMilestonesToCSV(
  projectName: string,
  milestoneData: {
    milestoneName: string;
    topicCode: string;
    topicTitle: string;
    itemNo: string;
    title: string;
    status: string;
    progress: number;
    weight: number;
    assigneeName: string;
    dueDate: string;
  }[]
) {
  const headers = [
    'งวดงาน',
    'รหัสหัวข้อ',
    'หัวข้องานหลัก',
    'ลำดับข้อ',
    'รายละเอียดงานย่อย',
    'สถานะงาน',
    'ความคืบหน้า (%)',
    'ค่าน้ำหนัก (%)',
    'ผู้รับผิดชอบ',
    'กำหนดส่งมอบ'
  ];

  const escapeCSV = (str: string | number) => {
    const val = String(str ?? '').replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows = [
    headers.map(escapeCSV).join(','),
    ...milestoneData.map((row) =>
      [
        row.milestoneName,
        row.topicCode,
        row.topicTitle,
        row.itemNo,
        row.title,
        row.status,
        row.progress,
        row.weight,
        row.assigneeName,
        row.dueDate
      ]
        .map(escapeCSV)
        .join(',')
    )
  ];

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanName = projectName.replace(/[^\w\u0E00-\u0E7F-]/g, '_');
  a.download = `รายงานติดตามงาน_${cleanName}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
