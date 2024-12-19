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

export const generateShiftPDF = async (shifts, format) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add header
      doc.fontSize(20).text('Shift Report', { align: 'center' });
      doc.moveDown();

      // Add report period
      if (shifts.length > 0) {
        const startDate = new Date(Math.min(...shifts.map(s => s.startTime)));
        const endDate = new Date(Math.max(...shifts.map(s => s.endTime)));
        doc.fontSize(12).text(`Report Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
        doc.moveDown();
      }

      // Group shifts based on format
      let groupedShifts = {};
      shifts.forEach(shift => {
        let key;
        const date = new Date(shift.startTime);
        
        switch (format) {
          case 'daily':
            key = date.toLocaleDateString();
            break;
          case 'weekly':
            // Get the Monday of the week
            const monday = new Date(date);
            monday.setDate(date.getDate() - date.getDay() + 1);
            key = monday.toLocaleDateString();
            break;
          case 'monthly':
            key = `${date.getMonth() + 1}/${date.getFullYear()}`;
            break;
          default:
            key = 'All Shifts';
        }

        if (!groupedShifts[key]) {
          groupedShifts[key] = [];
        }
        groupedShifts[key].push(shift);
      });

      // Add shifts to PDF
      Object.entries(groupedShifts).forEach(([period, periodShifts]) => {
        // Add period header
        doc.fontSize(16).text(period, { underline: true });
        doc.moveDown();

        // Add shifts
        periodShifts.forEach(shift => {
          doc.fontSize(12);
          
          // Shift header
          doc.text(`Date: ${new Date(shift.startTime).toLocaleDateString()}`);
          doc.text(`Time: ${new Date(shift.startTime).toLocaleTimeString()} - ${new Date(shift.endTime).toLocaleTimeString()}`);
          doc.text(`Location: ${shift.location.name}`);
          doc.text(`Address: ${shift.location.address}`);
          doc.text(`Role: ${shift.role}`);
          doc.text(`Status: ${shift.status}`);
          
          // Staff details if assigned
          if (shift.assignedTo) {
            doc.text(`Staff: ${shift.assignedTo.firstName} ${shift.assignedTo.lastName}`);
            if (shift.checkedInAt) {
              doc.text(`Checked In: ${new Date(shift.checkedInAt).toLocaleTimeString()}`);
            }
            if (shift.checkedOutAt) {
              doc.text(`Checked Out: ${new Date(shift.checkedOutAt).toLocaleTimeString()}`);
            }
          }

          // Pay details
          doc.text(`Pay Rate: £${shift.payRate}/hour`);
          
          // Notes if any
          if (shift.notes) {
            doc.text(`Notes: ${shift.notes}`);
          }

          doc.moveDown();
        });

        // Add summary for the period
        const totalHours = periodShifts.reduce((total, shift) => {
          const duration = new Date(shift.endTime) - new Date(shift.startTime);
          return total + (duration / (1000 * 60 * 60));
        }, 0);

        const totalPay = periodShifts.reduce((total, shift) => {
          const duration = new Date(shift.endTime) - new Date(shift.startTime);
          const hours = duration / (1000 * 60 * 60);
          return total + (hours * shift.payRate);
        }, 0);

        doc.fontSize(14).text('Period Summary', { underline: true });
        doc.fontSize(12);
        doc.text(`Total Shifts: ${periodShifts.length}`);
        doc.text(`Total Hours: ${totalHours.toFixed(2)}`);
        doc.text(`Total Pay: £${totalPay.toFixed(2)}`);
        doc.moveDown(2);
      });

      // Add footer
      doc.fontSize(10).text(`Generated on ${new Date().toLocaleString()}`, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};