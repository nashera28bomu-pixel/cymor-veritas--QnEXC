const path = require('path');

const CATEGORY_MAP = {
  // Images
  png: 'image', jpg: 'image', jpeg: 'image', webp: 'image', bmp: 'image', heic: 'image', gif: 'image',
  // Documents
  pdf: 'document', docx: 'document', doc: 'document', xlsx: 'document', xls: 'document',
  pptx: 'document', ppt: 'document',
  // Audio
  mp3: 'audio', wav: 'audio', aac: 'audio', flac: 'audio', ogg: 'audio', m4a: 'audio', oga: 'audio',
  // Archives
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive',
  // Dev / text
  json: 'devtext', yaml: 'devtext', yml: 'devtext', xml: 'devtext', txt: 'devtext',
};

const MENUS = {
  image: (fileToken) => ({
    text: 'What would you like to convert this image to?',
    buttons: [
      [{ text: '🖼 JPG', callback_data: `img:jpg:${fileToken}` }, { text: '📄 PDF', callback_data: `img:pdf:${fileToken}` }],
      [{ text: '📐 WEBP', callback_data: `img:webp:${fileToken}` }, { text: '📦 Compress', callback_data: `img:compress:${fileToken}` }],
      [{ text: '✨ Resize', callback_data: `img:resize:${fileToken}` }, { text: '🖌 Remove BG', callback_data: `img:removebg:${fileToken}` }],
    ],
  }),
  document: (fileToken, ext) => {
    const rows = [];
    if (ext === 'pdf') {
      rows.push(
        [{ text: '📄→🖼 To JPG', callback_data: `doc:pdf2jpg:${fileToken}` }],
        [{ text: '🔀 Merge', callback_data: `doc:merge:${fileToken}` }, { text: '✂️ Split', callback_data: `doc:split:${fileToken}` }],
        [{ text: '📦 Compress', callback_data: `doc:compresspdf:${fileToken}` }, { text: '🔄 Rotate', callback_data: `doc:rotate:${fileToken}` }],
        [{ text: '🔒 Add Password', callback_data: `doc:addpw:${fileToken}` }],
        [{ text: '📝 OCR to Text', callback_data: `doc:ocr:${fileToken}` }]
      );
    } else if (['docx', 'doc'].includes(ext)) {
      rows.push([{ text: '📄 To PDF', callback_data: `doc:office2pdf:${fileToken}` }]);
    } else if (['xlsx', 'xls', 'pptx', 'ppt'].includes(ext)) {
      rows.push([{ text: '📄 To PDF', callback_data: `doc:office2pdf:${fileToken}` }]);
    }
    return { text: 'What would you like to do with this document?', buttons: rows };
  },
  audio: (fileToken) => ({
    text: 'Convert this audio to:',
    buttons: [
      [{ text: 'MP3', callback_data: `aud:mp3:${fileToken}` }, { text: 'WAV', callback_data: `aud:wav:${fileToken}` }],
      [{ text: 'AAC', callback_data: `aud:aac:${fileToken}` }, { text: 'FLAC', callback_data: `aud:flac:${fileToken}` }],
      [{ text: '✂️ Trim', callback_data: `aud:trim:${fileToken}` }, { text: '🔊 Boost Volume', callback_data: `aud:boost:${fileToken}` }],
    ],
  }),
  archive: (fileToken) => ({
    text: 'Archive detected:',
    buttons: [[{ text: '📦 Extract & List Files', callback_data: `arc:extract:${fileToken}` }]],
  }),
  devtext: (fileToken, ext) => {
    const rows = [];
    if (ext === 'json') rows.push([{ text: 'JSON → YAML', callback_data: `dev:json2yaml:${fileToken}` }], [{ text: '✨ Format/Pretty', callback_data: `dev:jsonformat:${fileToken}` }]);
    if (['yaml', 'yml'].includes(ext)) rows.push([{ text: 'YAML → JSON', callback_data: `dev:yaml2json:${fileToken}` }]);
    if (ext === 'xml') rows.push([{ text: 'XML → JSON', callback_data: `dev:xml2json:${fileToken}` }]);
    return { text: 'What would you like to do with this file?', buttons: rows };
  },
};

function detectCategory(fileName) {
  const ext = path.extname(fileName || '').replace('.', '').toLowerCase();
  return { ext, category: CATEGORY_MAP[ext] || null };
}

function buildMenu(category, fileToken, ext) {
  const builder = MENUS[category];
  if (!builder) return null;
  return builder(fileToken, ext);
}

module.exports = { detectCategory, buildMenu };
