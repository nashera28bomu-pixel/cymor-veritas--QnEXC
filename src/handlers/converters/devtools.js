const fs = require('fs');
const yaml = require('js-yaml');
const convert = require('xml-js');
const QRCode = require('qrcode');
const { tempPath } = require('../../utils/tempFiles');

function jsonToYaml(inputPath) {
  const json = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const out = tempPath('.yaml');
  fs.writeFileSync(out, yaml.dump(json));
  return out;
}

function yamlToJson(inputPath) {
  const doc = yaml.load(fs.readFileSync(inputPath, 'utf8'));
  const out = tempPath('.json');
  fs.writeFileSync(out, JSON.stringify(doc, null, 2));
  return out;
}

function xmlToJson(inputPath) {
  const xml = fs.readFileSync(inputPath, 'utf8');
  const result = convert.xml2json(xml, { compact: true, spaces: 2 });
  const out = tempPath('.json');
  fs.writeFileSync(out, result);
  return out;
}

function formatJson(inputPath) {
  const json = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const out = tempPath('.json');
  fs.writeFileSync(out, JSON.stringify(json, null, 2));
  return out;
}

async function generateQR(text) {
  const out = tempPath('.png');
  await QRCode.toFile(out, text, { width: 500 });
  return out;
}

module.exports = { jsonToYaml, yamlToJson, xmlToJson, formatJson, generateQR };
