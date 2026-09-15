import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', '..', 'public', 'images');

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = EXT_BY_MIME[file.mimetype] ?? path.extname(file.originalname).slice(0, 5);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
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
 * Stores an uploaded file directly on the server's own disk under
 * public/images (the same directory the seeded images live in, already
 * served statically at /images) and hands back the relative path the
 * client stores as imageUrl — so an admin no longer has to find or paste a
 * working direct image link.
 *
 * Note for later: this is local-disk storage, which does not survive a
 * fresh deploy on a host with an ephemeral filesystem (e.g. Render). Fine
 * for local dev and a single long-running instance; swap for object
 * storage (S3, Cloudinary, etc.) before relying on it in production.
 */
router.post('/', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
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
    res.status(201).json({ imageUrl: `/images/${req.file.filename}` });
  });
});

export default router;
