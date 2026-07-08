const path = require('path');
const tokenStore = require('../utils/fileTokenStore');
const { downloadTelegramFile, cleanup } = require('../utils/tempFiles');
const { recordConversion } = require('../middleware/limits');

const imageConv = require('./converters/image');
const docConv = require('./converters/document');
const audioConv = require('./converters/audio');
const devConv = require('./converters/devtools');

async function runConversion(bot, telegramId, action, ext, filePath) {
  // action format: "<category>:<operation>"
  const [category, operation] = action.split(':');

  switch (category) {
    case 'img': {
      if (operation === 'pdf') return { path: await imageConv.toPDF(filePath), multi: false };
      if (operation === 'compress') return { path: await imageConv.compress(filePath), multi: false };
      if (operation === 'resize') return { path: await imageConv.resize(filePath), multi: false };
      if (operation === 'removebg') {
        throw new Error(
          'Background removal needs an external AI service (e.g. remove.bg API) — not included in v1. Add an API key to enable it.'
        );
      }
      return { path: await imageConv.toFormat(filePath, operation), multi: false };
    }
    case 'doc': {
      if (operation === 'office2pdf') return { path: await docConv.officeToPDF(filePath), multi: false };
      if (operation === 'pdf2jpg') return { path: await docConv.pdfToJPG(filePath), multi: false };
      if (operation === 'compresspdf') return { path: await docConv.officeToPDF(filePath), multi: false }; // placeholder, real compression needs ghostscript binary
      if (operation === 'rotate') return { path: await docConv.rotatePDF(filePath, 90), multi: false };
      if (operation === 'split') return { path: await docConv.splitPDF(filePath), multi: true };
      if (operation === 'ocr') return { path: await docConv.ocrToText(filePath), multi: false };
      if (operation === 'merge') {
        throw new Error('Merge requires sending multiple PDFs — this flow is coming in v1.1. For now, use one file at a time.');
      }
      if (operation === 'addpw') {
        throw new Error('Password protection requires a native encryption library not yet wired up in v1.');
      }
      throw new Error(`Unknown document operation: ${operation}`);
    }
    case 'aud': {
      if (['mp3', 'wav', 'aac', 'flac'].includes(operation)) return { path: await audioConv.convertFormat(filePath, operation), multi: false };
      if (operation === 'trim') return { path: await audioConv.trim(filePath, 0, 30), multi: false };
      if (operation === 'boost') return { path: await audioConv.boostVolume(filePath, 1.5), multi: false };
      throw new Error(`Unknown audio operation: ${operation}`);
    }
    case 'dev': {
      if (operation === 'json2yaml') return { path: await devConv.jsonToYaml(filePath), multi: false };
      if (operation === 'yaml2json') return { path: await devConv.yamlToJson(filePath), multi: false };
      if (operation === 'xml2json') return { path: await devConv.xmlToJson(filePath), multi: false };
      if (operation === 'jsonformat') return { path: await devConv.formatJson(filePath), multi: false };
      throw new Error(`Unknown dev operation: ${operation}`);
    }
    default:
      throw new Error(`Unknown category: ${category}`);
  }
}

// Handles inline button presses: callback_data = "<category>:<operation>:<token>"
async function handleCallback(ctx) {
  const data = ctx.callbackQuery.data;
  const lastColon = data.lastIndexOf(':');
  const action = data.slice(0, lastColon); // e.g. "img:jpg"
  const token = data.slice(lastColon + 1);

  const fileInfo = tokenStore.get(token);
  if (!fileInfo) {
    await ctx.answerCbQuery('This request expired. Please resend the file.', { show_alert: true });
    return;
  }

  await ctx.answerCbQuery('Processing...');
  const processingMsg = await ctx.reply('⏳ Converting your file...');

  let downloadedPath;
  const outputPaths = [];

  try {
    const ext = path.extname(fileInfo.fileName) || '';
    downloadedPath = await downloadTelegramFile(ctx.telegram, fileInfo.fileId, ext);

    const result = await runConversion(ctx.telegram, fileInfo.telegramId, action, ext, downloadedPath);

    if (result.multi) {
      for (const p of result.path) {
        await ctx.replyWithDocument({ source: p });
        outputPaths.push(p);
      }
    } else {
      await ctx.replyWithDocument({ source: result.path });
      outputPaths.push(result.path);
    }

    await recordConversion(ctx.state.user);
  } catch (err) {
    console.error('[convertDispatcher] error:', err.message);
    await ctx.reply(`❌ Conversion failed: ${err.message}`);
  } finally {
    cleanup(downloadedPath, ...outputPaths);
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);
    } catch {}
  }
}

// Runs a conversion automatically based on a user's saved auto-convert rule
async function runAutoConvert(ctx) {
  const { token, ext, target } = ctx.state.autoConvert;
  const fileInfo = tokenStore.get(token);
  if (!fileInfo) return;

  let category = 'doc';
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext.replace('.', ''))) category = 'img';

  const action = `${category}:${target}`;
  let downloadedPath;
  const outputPaths = [];

  try {
    downloadedPath = await downloadTelegramFile(ctx.telegram, fileInfo.fileId, ext);
    const result = await runConversion(ctx.telegram, fileInfo.telegramId, action, ext, downloadedPath);
    if (result.multi) {
      for (const p of result.path) {
        await ctx.replyWithDocument({ source: p });
        outputPaths.push(p);
      }
    } else {
      await ctx.replyWithDocument({ source: result.path });
      outputPaths.push(result.path);
    }
    await recordConversion(ctx.state.user);
  } catch (err) {
    await ctx.reply(`❌ Auto-convert failed: ${err.message}`);
  } finally {
    cleanup(downloadedPath, ...outputPaths);
  }
}

module.exports = { handleCallback, runAutoConvert };
