import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { requirePremium } from '../middleware/auth.js';
import { UserProfile } from '../models/UserProfile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      return cb(new Error('Only PNG, JPG, WEBP, and GIF logos are allowed.'));
    }
    cb(null, true);
  }
});

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { role: req.user.role }, $setOnInsert: { userId: req.user.id } },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.post('/logo', requirePremium, upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Logo file is required.' });

    const logoUrl = `/uploads/${req.file.filename}`;
    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        role: req.user.role,
        logoUrl,
        logoFileName: req.file.originalname
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

export default router;
