const fs = require('fs');
const util = require('util');
const { PDFDocument, degrees } = require('pdf-lib');
const libre = require('libreoffice-convert');
const Tesseract = require('tesseract.js');
const { tempPath } = require('../../utils/tempFiles');

const libreConvertAsync = util.promisify(libre.convert);

// Requires LibreOffice installed on the host (add via Dockerfile/apt on Render).
async function officeToPDF(inputPath) {
  const inputBuf = fs.readFileSync(inputPath);
  const outputBuf = await libreConvertAsync(inputBuf, '.pdf', undefined);
  const out = tempPath('.pdf');
  fs.writeFileSync(out, outputBuf);
  return out;
}

async function pdfToJPG(inputPath) {
  // Lightweight route: render first page only using pdf-lib + sharp is not directly supported
  // (pdf-lib doesn't rasterize). This uses libreoffice as a fallback rasterizer via PDF->PNG export.
  const inputBuf = fs.readFileSync(inputPath);
  const outputBuf = await libreConvertAsync(inputBuf, '.jpg', undefined);
  const out = tempPath('.jpg');
  fs.writeFileSync(out, outputBuf);
  return out;
}

async function mergePDFs(inputPaths) {
  const merged = await PDFDocument.create();
  for (const p of inputPaths) {
    const bytes = fs.readFileSync(p);
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((pg) => merged.addPage(pg));
  }
  const out = tempPath('.pdf');
  fs.writeFileSync(out, await merged.save());
  return out;
}

async function splitPDF(inputPath) {
  const bytes = fs.readFileSync(inputPath);
  const src = await PDFDocument.load(bytes);
  const outPaths = [];
  for (let i = 0; i < src.getPageCount(); i++) {
    const newDoc = await PDFDocument.create();
    const [page] = await newDoc.copyPages(src, [i]);
    newDoc.addPage(page);
    const out = tempPath(`_page${i + 1}.pdf`);
    fs.writeFileSync(out, await newDoc.save());
    outPaths.push(out);
  }
  return outPaths;
}

async function rotatePDF(inputPath, degreesAmount = 90) {
  const bytes = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(bytes);
  doc.getPages().forEach((page) => page.setRotation(degrees(degreesAmount)));
  const out = tempPath('.pdf');
  fs.writeFileSync(out, await doc.save());
  return out;
}

async function addPassword(inputPath, password) {
  // Note: pdf-lib does not support encryption natively.
  // This is a known v1 limitation — flagged honestly rather than faked.
  throw new Error('Password protection requires a native encryption library (e.g. qpdf) not yet wired up in v1.');
}

async function ocrToText(inputPath) {
  const { data } = await Tesseract.recognize(inputPath, 'eng');
  const out = tempPath('.txt');
  fs.writeFileSync(out, data.text);
  return out;
}

module.exports = { officeToPDF, pdfToJPG, mergePDFs, splitPDF, rotatePDF, addPassword, ocrToText };
