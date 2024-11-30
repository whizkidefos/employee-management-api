import PDFDocument from 'pdfkit';
import { uploadToS3 } from './storage.js';

export const generateCertificate = async ({
  userName,
  courseName,
  completionDate,
  certificateId
}) => {
  const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4'
  });

  // Buffer to store PDF
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));

  // Certificate design
  doc.image('src/assets/certificate-template.png', 0, 0, { width: 842 });
  
  doc.font('src/assets/fonts/certificate-font.ttf')
     .fontSize(40)
     .text(userName, 0, 295, {
       align: 'center'
     });

  doc.fontSize(20)
     .text(courseName, 0, 370, {
       align: 'center'
     });

  doc.fontSize(15)
     .text(new Date(completionDate).toLocaleDateString(), 0, 440, {
       align: 'center'
     });

  doc.fontSize(12)
     .text(`Certificate ID: ${certificateId}`, 30, 500);

  return new Promise((resolve, reject) => {
    doc.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const fileName = `certificates/${certificateId}.pdf`;
        const url = await uploadToS3(fileName, buffer, 'application/pdf');
        resolve(url);
      } catch (error) {
        reject(error);
      }
    });

    doc.end();
  });
};