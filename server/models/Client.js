import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 40, default: '' },
    billingAddress: { type: String, trim: true, maxlength: 500, default: '' }
  },
  { timestamps: true }
);

clientSchema.index({ userId: 1, email: 1 });

export const Client = mongoose.model('Client', clientSchema);
