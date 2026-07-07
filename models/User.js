const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true, index: true },
    username: { type: String, default: null },
    firstName: { type: String, default: null },

    isPremium: { type: Boolean, default: false },
    premiumExpiry: { type: Date, default: null }, // null + isPremium true = lifetime (e.g. via referrals)
    premiumSource: { type: String, enum: ['none', 'admin', 'coupon', 'referral'], default: 'none' },

    referredBy: { type: String, default: null }, // telegramId of referrer
    referralCount: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true },

    dailyConversionsUsed: { type: Number, default: 0 },
    lastConversionReset: { type: Date, default: Date.now },

    autoConvertRules: { type: Map, of: String, default: {} }, // e.g. { "docx": "pdf" }

    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.methods.isPremiumActive = function () {
  if (!this.isPremium) return false;
  if (!this.premiumExpiry) return true; // lifetime premium (referral-earned)
  return this.premiumExpiry > new Date();
};

module.exports = mongoose.model('User', userSchema);
