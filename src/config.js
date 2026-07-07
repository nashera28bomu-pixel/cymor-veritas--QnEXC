require('dotenv').config();

const config = {
  botToken: process.env.BOT_TOKEN,
  adminIds: (process.env.ADMIN_IDS || '').split(',').map((id) => id.trim()).filter(Boolean),
  mongoUri: process.env.MONGODB_URI,
  externalUrl: process.env.RENDER_EXTERNAL_URL || '',
  port: process.env.PORT || 3000,
  freeDailyConversions: parseInt(process.env.FREE_DAILY_CONVERSIONS || '15', 10),
  freeMaxFileMB: parseInt(process.env.FREE_MAX_FILE_MB || '15', 10),
  premiumMaxFileMB: parseInt(process.env.PREMIUM_MAX_FILE_MB || '50', 10),
  referralsForPremium: parseInt(process.env.REFERRALS_FOR_PREMIUM || '20', 10),
};

if (!config.botToken) {
  console.error('FATAL: BOT_TOKEN is missing from environment variables.');
  process.exit(1);
}
if (!config.mongoUri) {
  console.error('FATAL: MONGODB_URI is missing from environment variables.');
  process.exit(1);
}

module.exports = config;
