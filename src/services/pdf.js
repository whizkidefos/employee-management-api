import PDFDocument from 'pdfkit';
import { formatDate, formatCurrency } from '../utils/helpers.js';

export const generatePDF = async ({ type, data }) => {
  const doc = new PDFDocument();
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));

  switch (type) {
    case 'SHIFT_REPORT':
      generateShiftReport(doc, data);
      break;
    case 'USER_PROFILE':
      generateUserProfile(doc, data);
      break;
    case 'COURSE_CERTIFICATE':
      generateCourseCertificate(doc, data);
      break;
    default:
      throw new Error('Invalid PDF type');
  }

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
    doc.end();
  });
};

const generateShiftReport = (doc, { shifts, dateRange }) => {
  doc.fontSize(20).text('Shift Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Period: ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}`);

  shifts.forEach(shift => {
    doc.moveDown()
       .text(`Date: ${formatDate(shift.startTime)}`)
       .text(`Employee: ${shift.assignedTo.firstName} ${shift.assignedTo.lastName}`)
       .text(`Hours Worked: ${calculateHours(shift.startTime, shift.endTime)}`)
       .text(`Pay Rate: ${formatCurrency(shift.payRate)}`);
  });
};