const config = require('../config');

function checkFileSize(user, fileSizeBytes) {
  const maxMB = user.isPremiumActive() ? config.premiumMaxFileMB : config.freeMaxFileMB;
  const sizeMB = fileSizeBytes / (1024 * 1024);
  if (sizeMB > maxMB) {
    return {
      ok: false,
      message: `That file is ${sizeMB.toFixed(1)}MB, which is over your ${maxMB}MB limit. ${
        user.isPremiumActive() ? '' : 'Upgrade to Premium for larger files.'
      }`,
    };
  }
  return { ok: true };
}

function checkDailyQuota(user) {
  if (user.isPremiumActive()) return { ok: true };
  if (user.dailyConversionsUsed >= config.freeDailyConversions) {
    return {
      ok: false,
      message: `You've used your ${config.freeDailyConversions} free conversions for today. Come back tomorrow, or upgrade to Premium for unlimited conversions.`,
    };
  }
  return { ok: true };
}

async function recordConversion(user) {
  user.dailyConversionsUsed += 1;
  await user.save();
}

module.exports = { checkFileSize, checkDailyQuota, recordConversion };
