const Coupon = require('../models/Coupon');

async function redeem(ctx) {
  const user = ctx.state.user;
  const code = (ctx.message.text.split(' ')[1] || '').toUpperCase().trim();

  if (!code) return ctx.reply('Usage: /redeem CODE');

  const coupon = await Coupon.findOne({ code });
  if (!coupon || !coupon.isValid()) {
    return ctx.reply('That coupon is invalid, expired, or has already been fully used.');
  }
  if (coupon.usedBy.includes(user.telegramId)) {
    return ctx.reply("You've already used this coupon.");
  }

  if (coupon.type === 'premium_days') {
    const base = user.isPremiumActive() && user.premiumExpiry ? user.premiumExpiry : new Date();
    user.isPremium = true;
    user.premiumExpiry = new Date(base.getTime() + coupon.value * 86400000);
    user.premiumSource = 'coupon';
    await user.save();
  }

  coupon.usedCount += 1;
  coupon.usedBy.push(user.telegramId);
  await coupon.save();

  await ctx.reply(`✅ Coupon redeemed! You now have Premium until ${user.premiumExpiry.toDateString()}.`);
}

module.exports = redeem;
