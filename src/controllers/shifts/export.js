import PDFDocument from 'pdfkit';
import { formatDate } from '../../utils/helpers.js';

export const exportShiftReport = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    const query = {
      startTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (userId) {
      query.assignedTo = userId;
    }

    const shifts = await Shift.find(query)
      .populate('assignedTo', 'firstName lastName')
      .sort({ startTime: 1 });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shifts-${startDate}-${endDate}.pdf`);
    doc.pipe(res);

    // Generate PDF content
    doc.fontSize(20).text('Shift Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${formatDate(startDate)} to ${formatDate(endDate)}`);
    doc.moveDown();

    shifts.forEach(shift => {
      doc.text(`Date: ${formatDate(shift.startTime)}`);
      doc.text(`Employee: ${shift.assignedTo.firstName} ${shift.assignedTo.lastName}`);
      doc.text(`Role: ${shift.role}`);
      doc.text(`Location: ${shift.location.name}`);
      doc.text(`Status: ${shift.status}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};