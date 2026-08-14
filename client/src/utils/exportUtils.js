import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = (title, columns, data, filename = 'Kopargaon_Smart_City_Report.pdf') => {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("KOPARGAON MUNICIPAL COUNCIL", 14, 15);
  doc.setFontSize(10);
  doc.text("Smart Development Planning & Digital GIS Portal", 14, 23);

  // Report Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text(title, 14, 42);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Official Record`, 14, 48);

  // Table
  autoTable(doc, {
    startY: 54,
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => row[c.key])),
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    }
  });

  doc.save(filename);
};

export const exportToExcel = (data, sheetName = 'Report', filename = 'Kopargaon_Smart_City_Export.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};
