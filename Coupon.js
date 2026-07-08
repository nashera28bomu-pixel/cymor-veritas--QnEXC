const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['premium_days', 'discount_percent'], default: 'premium_days' },
    value: { type: Number, required: true }, // days of premium, or % discount
    maxUses: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: String }], // telegramIds
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

couponSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  if (this.usedCount >= this.maxUses) return false;
  return true;
};

module.exports = mongoose.model('Coupon', couponSchema);
