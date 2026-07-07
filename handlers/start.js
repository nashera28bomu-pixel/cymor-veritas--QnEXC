const User = require('../models/User');
const config = require('../config');

async function handleStart(ctx) {
  const user = ctx.state.user;
  const payload = ctx.startPayload; // referral code passed via t.me/Bot?start=CODE

  // Only attribute a referral once, and never let a user refer themselves
  if (payload && !user.referredBy && payload !== user.referralCode) {
    const referrer = await User.findOne({ referralCode: payload });
    if (referrer && referrer.telegramId !== user.telegramId) {
      user.referredBy = referrer.telegramId;
      await user.save();

      referrer.referralCount += 1;

      let unlockedPremium = false;
      if (referrer.referralCount >= config.referralsForPremium && !referrer.isPremiumActive()) {
        referrer.isPremium = true;
        referrer.premiumExpiry = null; // lifetime
        referrer.premiumSource = 'referral';
        unlockedPremium = true;
      }
      await referrer.save();

      try {
        await ctx.telegram.sendMessage(
          referrer.telegramId,
          unlockedPremium
            ? `🎉 Someone joined using your referral link — that's ${referrer.referralCount}/${config.referralsForPremium}! You've unlocked Premium for life!`
            : `👋 Someone joined using your referral link — ${referrer.referralCount}/${config.referralsForPremium} toward free Premium.`
        );
      } catch (e) {
        // referrer may have blocked the bot — non-fatal
      }
    }
  }

  const botUsername = ctx.botInfo?.username || 'CymorConvertBot';
  const referralLink = `https://t.me/${botUsername}?start=${user.referralCode}`;

  await ctx.reply(
    `⚡ *Cymor Convert Bot*\n_Convert Anything. Instantly._\n\n` +
      `Just send me a file — image, PDF, Word doc, audio, JSON, whatever — and I'll show you what I can do with it.\n\n` +
      `🎁 Free tier: ${config.freeDailyConversions} conversions/day, up to ${config.freeMaxFileMB}MB per file.\n` +
      `💎 Premium: unlimited conversions, up to ${config.premiumMaxFileMB}MB files.\n\n` +
      `Refer ${config.referralsForPremium} friends to unlock Premium for free 👇\n${referralLink}`,
    { parse_mode: 'Markdown' }
  );
}

module.exports = handleStart;
