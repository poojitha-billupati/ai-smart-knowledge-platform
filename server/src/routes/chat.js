import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { retrieve } from '../services/retrieval.js';
import { askOllama, OllamaUnavailableError } from '../services/ollama.js';
import { matchDemoResponse } from '../services/demoResponses.js';

const FALLBACK_ANSWER = "I don't have that information in my knowledge base.";

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post(
  '/',
  chatLimiter,
  body('question').isString().trim().isLength({ min: 1, max: 500 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { question } = req.body;

    try {
      const { matched, sources, contextBlock } = await retrieve(question);

      if (!matched) {
        return res.json({ answer: FALLBACK_ANSWER, sources: [] });
      }

      if (process.env.DEMO_MODE === 'true') {
        const demo = matchDemoResponse(question);
        return res.json(demo ?? { answer: FALLBACK_ANSWER, sources: [] });
      }

      try {
        const answer = await askOllama(question, contextBlock);
        return res.json({ answer, sources });
      } catch (err) {
        if (err instanceof OllamaUnavailableError) {
          console.warn('Ollama unavailable, falling back to canned response:', err.message);
          const demo = matchDemoResponse(question);
          return res.json(demo ?? { answer: FALLBACK_ANSWER, sources: [] });
        }
        throw err;
      }
    } catch (err) {
      next(err);
    }
  },
);

export default router;
