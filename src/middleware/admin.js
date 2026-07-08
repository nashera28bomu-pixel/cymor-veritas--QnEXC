const config = require('../config');

function isAdminId(telegramId) {
  return config.adminIds.includes(String(telegramId));
}

// Telegraf middleware — use on admin-only commands
async function adminOnly(ctx, next) {
  if (!ctx.from || !isAdminId(ctx.from.id)) {
    return ctx.reply("This command is admin-only.");
  }
  return next();
}

module.exports = { isAdminId, adminOnly };
