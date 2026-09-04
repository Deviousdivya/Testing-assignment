import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ['free', 'premium'], default: 'free' },
    logoUrl: { type: String, default: '' },
    logoFileName: { type: String, default: '' }
  },
  { timestamps: true }
);

export const UserProfile = mongoose.model('UserProfile', userProfileSchema);
