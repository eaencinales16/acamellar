const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');

// Render stored plain-text resume/cover-letter into a clean PDF buffer.
// First non-empty line is treated as a title (usually the candidate's name).
function buildPdf(text) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54, size: 'LETTER' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const lines = text.replace(/\r\n/g, '\n').split('\n');
    let titleDone = false;
    for (const line of lines) {
      if (line.trim() === '') { doc.moveDown(0.5); continue; }
      if (!titleDone) {
        doc.font('Times-Bold').fontSize(16).text(line.trim());
        doc.moveDown(0.3);
        titleDone = true;
      } else {
        doc.font('Times-Roman').fontSize(11).text(line, { paragraphGap: 2 });
      }
    }
    doc.end();
  });
}

// Render the same text into a .docx buffer.
async function buildDocx(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let titleDone = false;
  const paragraphs = lines.map(line => {
    if (line.trim() === '') return new Paragraph({ children: [] });
    if (!titleDone) {
      titleDone = true;
      return new Paragraph({ children: [new TextRun({ text: line.trim(), bold: true, size: 32 })] });
    }
    return new Paragraph({ children: [new TextRun({ text: line, size: 22 })] });
  });
  const doc = new Document({ sections: [{ children: paragraphs }] });
  return Packer.toBuffer(doc);
}

module.exports = { buildPdf, buildDocx };
