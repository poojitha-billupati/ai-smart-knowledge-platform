import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/auth.js';
import UploadedFile from '../models/UploadedFile.js';

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (!EXT_BY_MIME[file.mimetype]) {
      return cb(new Error('Only JPEG, PNG, WebP or GIF images are allowed'));
    }
    cb(null, true);
  },
});

const router = Router();

/**
 * Stores an uploaded image in MongoDB (served back at /images/:filename by
 * the route in index.js) and hands back the relative path the client stores
 * as imageUrl. The database, unlike the server's disk, survives redeploys
 * and restarts on hosts with an ephemeral filesystem such as Render.
 */
router.post('/', requireAdmin, (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 8MB or smaller' : err.message;
      return res.status(400).json({ error: message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file was sent' });
    }

    try {
      const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT_BY_MIME[req.file.mimetype]}`;
      await UploadedFile.create({
        filename,
        contentType: req.file.mimetype,
        data: req.file.buffer,
      });
      res.status(201).json({ imageUrl: `/images/${filename}` });
    } catch (saveErr) {
      next(saveErr);
    }
  });
});

export default router;
