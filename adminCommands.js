const User = require('../models/User');
const Coupon = require('../models/Coupon');
const { nanoid } = require('nanoid');

// /broadcast <message>
async function broadcast(ctx) {
  const message = ctx.message.text.replace(/^\/broadcast\s*/, '');
  if (!message) return ctx.reply('Usage: /broadcast Your message here');

  const users = await User.find({ isBanned: false }, 'telegramId');
  await ctx.reply(`Sending to ${users.length} users...`);

  let sent = 0;
  let failed = 0;
  for (const u of users) {
    try {
      await ctx.telegram.sendMessage(u.telegramId, message);
      sent++;
    } catch {
      failed++;
    }
    // small delay to respect Telegram rate limits (~30 msgs/sec ceiling)
    await new Promise((r) => setTimeout(r, 40));
  }
  await ctx.reply(`Broadcast done. Sent: ${sent}, Failed/Blocked: ${failed}`);
}

// /promote <telegram_id> <days optional, blank = lifetime>
async function promote(ctx) {
  const parts = ctx.message.text.split(' ').filter(Boolean);
  const targetId = parts[1];
  const days = parts[2] ? parseInt(parts[2], 10) : null;

  if (!targetId) return ctx.reply('Usage: /promote <telegram_id> [days]');

  const user = await User.findOne({ telegramId: targetId });
  if (!user) return ctx.reply('No user found with that Telegram ID.');

  user.isPremium = true;
  user.premiumExpiry = days ? new Date(Date.now() + days * 86400000) : null;
  user.premiumSource = 'admin';
  await user.save();

  await ctx.reply(`✅ User ${targetId} promoted to Premium${days ? ` for ${days} days` : ' (lifetime)'}.`);
  try {
    await ctx.telegram.sendMessage(targetId, `🎉 You've been upgraded to Premium${days ? ` for ${days} days` : ''}! Enjoy unlimited conversions.`);
  } catch {}
}

// /demote <telegram_id>
async function demote(ctx) {
  const targetId = ctx.message.text.split(' ')[1];
  if (!targetId) return ctx.reply('Usage: /demote <telegram_id>');
  const user = await User.findOne({ telegramId: targetId });
  if (!user) return ctx.reply('No user found with that Telegram ID.');
  user.isPremium = false;
  user.premiumExpiry = null;
  user.premiumSource = 'none';
  await user.save();
  await ctx.reply(`User ${targetId} demoted from Premium.`);
}

// /createcoupon <days> <maxUses> [customCode]
async function createCoupon(ctx) {
  const parts = ctx.message.text.split(' ').filter(Boolean);
  const days = parseInt(parts[1], 10);
  const maxUses = parseInt(parts[2], 10) || 1;
  const customCode = parts[3];

  if (!days) return ctx.reply('Usage: /createcoupon <premium_days> <max_uses> [custom_code]');

  const code = (customCode || nanoid(8)).toUpperCase();
  const coupon = await Coupon.create({ code, type: 'premium_days', value: days, maxUses });

  await ctx.reply(`✅ Coupon created: \`${coupon.code}\`\nGrants ${days} days Premium. Max uses: ${maxUses}`, {
    parse_mode: 'Markdown',
  });
}

// /stats
async function stats(ctx) {
  const total = await User.countDocuments();
  const premium = await User.countDocuments({ isPremium: true });
  const bannedCount = await User.countDocuments({ isBanned: true });
  await ctx.reply(`📊 Total users: ${total}\n💎 Premium: ${premium}\n🚫 Banned: ${bannedCount}`);
}

// /ban <telegram_id>  and  /unban <telegram_id>
async function ban(ctx) {
  const targetId = ctx.message.text.split(' ')[1];
  if (!targetId) return ctx.reply('Usage: /ban <telegram_id>');
  await User.updateOne({ telegramId: targetId }, { isBanned: true });
  await ctx.reply(`User ${targetId} banned.`);
}

async function unban(ctx) {
  const targetId = ctx.message.text.split(' ')[1];
  if (!targetId) return ctx.reply('Usage: /unban <telegram_id>');
  await User.updateOne({ telegramId: targetId }, { isBanned: false });
  await ctx.reply(`User ${targetId} unbanned.`);
}

module.exports = { broadcast, promote, demote, createCoupon, stats, ban, unban };
