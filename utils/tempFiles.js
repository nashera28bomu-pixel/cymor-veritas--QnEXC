const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const { nanoid } = require('nanoid');

const TEMP_DIR = path.join(os.tmpdir(), 'cymor-convert');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function tempPath(ext = '') {
  return path.join(TEMP_DIR, `${nanoid(12)}${ext}`);
}

// Accepts a Telegraf `telegram` client instance (ctx.telegram or bot.telegram — both work, same shape)
async function downloadTelegramFile(telegram, fileId, ext = '') {
  const link = await telegram.getFileLink(fileId);
  const response = await axios.get(link.href, { responseType: 'arraybuffer', timeout: 60000 });
  const filePath = tempPath(ext);
  fs.writeFileSync(filePath, response.data);
  return filePath;
}

function cleanup(...paths) {
  for (const p of paths) {
    try {
      if (p && fs.existsSync(p)) fs.unlinkSync(p);
    } catch (err) {
      console.warn('[cleanup] failed to remove', p, err.message);
    }
  }
}

module.exports = { tempPath, downloadTelegramFile, cleanup, TEMP_DIR };
