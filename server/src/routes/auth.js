import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post(
  '/login',
  loginLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      const valid = user && (await bcrypt.compare(password, user.passwordHash));

      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '24h',
      });

      res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
