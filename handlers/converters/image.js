const sharp = require('sharp');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { tempPath } = require('../../utils/tempFiles');

async function toFormat(inputPath, format) {
  const out = tempPath(`.${format}`);
  const pipeline = sharp(inputPath);
  if (format === 'jpg' || format === 'jpeg') await pipeline.jpeg({ quality: 90 }).toFile(out);
  else if (format === 'webp') await pipeline.webp({ quality: 90 }).toFile(out);
  else if (format === 'png') await pipeline.png().toFile(out);
  else throw new Error(`Unsupported image format: ${format}`);
  return out;
}

async function toPDF(inputPath) {
  const imageBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.create();
  let embedded;
  try {
    embedded = await pdfDoc.embedJpg(imageBytes);
  } catch {
    embedded = await pdfDoc.embedPng(imageBytes);
  }
  const page = pdfDoc.addPage([embedded.width, embedded.height]);
  page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  const pdfBytes = await pdfDoc.save();
  const out = tempPath('.pdf');
  fs.writeFileSync(out, pdfBytes);
  return out;
}

async function compress(inputPath) {
  const out = tempPath('.jpg');
  await sharp(inputPath).jpeg({ quality: 60, mozjpeg: true }).toFile(out);
  return out;
}

async function resize(inputPath, width = 800) {
  const out = tempPath('.jpg');
  await sharp(inputPath).resize({ width }).jpeg({ quality: 90 }).toFile(out);
  return out;
}

module.exports = { toFormat, toPDF, compress, resize };
