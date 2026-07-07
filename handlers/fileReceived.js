const { detectCategory, buildMenu } = require('./fileRouter');
const { checkFileSize, checkDailyQuota } = require('../middleware/limits');
const tokenStore = require('../utils/fileTokenStore');

async function handleIncomingFile(ctx) {
  const user = ctx.state.user;

  const quotaCheck = checkDailyQuota(user);
  if (!quotaCheck.ok) return ctx.reply(quotaCheck.message);

  let fileId, fileName, fileSize;

  if (ctx.message.document) {
    fileId = ctx.message.document.file_id;
    fileName = ctx.message.document.file_name || 'file';
    fileSize = ctx.message.document.file_size || 0;
  } else if (ctx.message.photo) {
    const largest = ctx.message.photo[ctx.message.photo.length - 1];
    fileId = largest.file_id;
    fileName = 'photo.jpg';
    fileSize = largest.file_size || 0;
  } else if (ctx.message.audio || ctx.message.voice) {
    const a = ctx.message.audio || ctx.message.voice;
    fileId = a.file_id;
    fileName = ctx.message.audio ? a.file_name || 'audio.mp3' : 'voice.ogg';
    fileSize = a.file_size || 0;
  } else {
    return ctx.reply("I couldn't read that file type yet.");
  }

  const sizeCheck = checkFileSize(user, fileSize);
  if (!sizeCheck.ok) return ctx.reply(sizeCheck.message);

  const { ext, category } = detectCategory(fileName);
  if (!category) {
    return ctx.reply(
      `I don't support ".${ext || 'this'}" files yet. Supported: images, PDF/Word/Excel/PowerPoint, audio, JSON/YAML/XML.`
    );
  }

  const token = tokenStore.save(fileId, fileName, String(ctx.from.id));

  // Check for an auto-convert rule for this extension
  const autoTarget = user.autoConvertRules && user.autoConvertRules.get ? user.autoConvertRules.get(ext) : null;
  if (autoTarget) {
    ctx.state.autoConvert = { token, ext, target: autoTarget };
    return require('./convertDispatcher').runAutoConvert(ctx);
  }

  const menu = buildMenu(category, token, ext);
  if (!menu || menu.buttons.length === 0) {
    return ctx.reply("I recognized this file but don't have conversions set up for it yet.");
  }

  await ctx.reply(menu.text, {
    reply_markup: { inline_keyboard: menu.buttons },
  });
}

module.exports = handleIncomingFile;
