const { Telegraf } = require('telegraf');
const config = require('./config');
const connectDB = require('./db/connect');
const startServer = require('./server');

const userLoader = require('./middleware/userLoader');
const { adminOnly } = require('./middleware/admin');

const handleStart = require('./handlers/start');
const handleIncomingFile = require('./handlers/fileReceived');
const { handleCallback } = require('./handlers/convertDispatcher');
const setAutoConvert = require('./handlers/autoConvert');
const redeem = require('./handlers/redeem');
const admin = require('./handlers/adminCommands');

const bot = new Telegraf(config.botToken, { handlerTimeout: 9_000_000 });

// ---- Global middleware ----
bot.use(userLoader);

// ---- User commands ----
bot.start(handleStart);

bot.help((ctx) =>
  ctx.reply(
    '⚡ *Cymor Convert Bot*\n\n' +
      'Just send me a file and I\'ll show you conversion options.\n\n' +
      '*Commands:*\n' +
      '/redeem CODE — redeem a coupon\n' +
      '/autoconvert <from> <to> — auto-convert file types without menus\n' +
      '/autoconvert clear <ext> — remove an auto-convert rule\n' +
      '/myreferral — get your referral link\n' +
      '/status — check your plan and usage',
    { parse_mode: 'Markdown' }
  )
);

bot.command('redeem', redeem);
bot.command('autoconvert', setAutoConvert);

bot.command('myreferral', async (ctx) => {
  const botUsername = ctx.botInfo?.username || 'CymorConvertBot';
  const link = `https://t.me/${botUsername}?start=${ctx.state.user.referralCode}`;
  await ctx.reply(
    `🔗 Your referral link:\n${link}\n\nProgress: ${ctx.state.user.referralCount}/${config.referralsForPremium} referrals toward free Premium.`
  );
});

bot.command('status', async (ctx) => {
  const u = ctx.state.user;
  const planLine = u.isPremiumActive()
    ? `💎 Premium${u.premiumExpiry ? ` until ${u.premiumExpiry.toDateString()}` : ' (lifetime)'}`
    : `🆓 Free tier — ${u.dailyConversionsUsed}/${config.freeDailyConversions} conversions used today`;
  await ctx.reply(planLine);
});

// ---- Admin commands ----
bot.command('broadcast', adminOnly, admin.broadcast);
bot.command('promote', adminOnly, admin.promote);
bot.command('demote', adminOnly, admin.demote);
bot.command('createcoupon', adminOnly, admin.createCoupon);
bot.command('stats', adminOnly, admin.stats);
bot.command('ban', adminOnly, admin.ban);
bot.command('unban', adminOnly, admin.unban);

// ---- File intake ----
bot.on(['document', 'photo', 'audio', 'voice'], handleIncomingFile);

// ---- Button presses ----
bot.on('callback_query', handleCallback);

// ---- Global error handler — logs but does NOT crash the process ----
bot.catch((err, ctx) => {
  console.error(`[Bot Error] update ${ctx?.update?.update_id}:`, err.message);
  try {
    ctx?.reply?.('Something went wrong processing that. Please try again.');
  } catch {}
});

// ---- Launch with retry so a network blip doesn't kill the bot permanently ----
async function launchWithRetry(attempt = 1) {
  try {
    await bot.launch({ dropPendingUpdates: true });
    console.log('[Bot] Launched and polling for updates.');
  } catch (err) {
    const delay = Math.min(30000, attempt * 5000);
    console.error(`[Bot] Launch attempt ${attempt} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
    setTimeout(() => launchWithRetry(attempt + 1), delay);
  }
}

async function main() {
  await connectDB();
  startServer(); // health endpoint + self-ping, also satisfies Render's port-binding requirement
  await launchWithRetry();
}

main();

// ---- Process-level safety nets ----
// Never let an unexpected error silently kill the bot process.
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err.message);
});

// Graceful shutdown on deploy/restart signals
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
