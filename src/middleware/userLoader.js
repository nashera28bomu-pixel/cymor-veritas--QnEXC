const User = require('../models/User');
const { nanoid } = require('nanoid');

function isNewDay(lastReset) {
  const now = new Date();
  const last = new Date(lastReset);
  return (
    now.getFullYear() !== last.getFullYear() ||
    now.getMonth() !== last.getMonth() ||
    now.getDate() !== last.getDate()
  );
}

async function userLoader(ctx, next) {
  if (!ctx.from) return next();

  try {
    const telegramId = String(ctx.from.id);
    let user = await User.findOne({ telegramId });

    if (!user) {
      user = await User.create({
        telegramId,
        username: ctx.from.username || null,
        firstName: ctx.from.first_name || null,
        referralCode: nanoid(8),
      });
    }

    if (user.isBanned) {
      return ctx.reply('Your access to this bot has been restricted. Contact support if you believe this is an error.');
    }

    // Reset daily conversion quota if it's a new day
    if (isNewDay(user.lastConversionReset)) {
      user.dailyConversionsUsed = 0;
      user.lastConversionReset = new Date();
      await user.save();
    }

    // expire premium if past date
    if (user.isPremium && user.premiumExpiry && user.premiumExpiry < new Date()) {
      user.isPremium = false;
      user.premiumSource = 'none';
      await user.save();
    }

    ctx.state.user = user;
    return next();
  } catch (err) {
    console.error('[userLoader] error:', err.message);
    return next(); // don't hard-fail the whole bot on a DB hiccup
  }
}

module.exports = userLoader;
