import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { retrieve, listUpcomingEvents, mergeRetrievals } from '../services/retrieval.js';
import { askModel, streamModel, ModelUnavailableError } from '../services/llm.js';
import { matchDemoResponse } from '../services/demoResponses.js';
import {
  detectSmallTalk,
  detectCreatorQuestion,
  buildRetrievalQuery,
  detectListIntent,
} from '../services/intent.js';

const NO_MATCH_ANSWER =
  "I don't have anything on file about that, and the AI backend isn't reachable right now to answer it generally either. I can help with admissions, fees and scholarships, hostel allotment, library and campus facilities, or upcoming events.";

const HISTORY_TURNS = 6;

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const validators = [
  body('question').isString().trim().isLength({ min: 1, max: 500 }),
  body('history').optional().isArray({ max: 20 }),
  body('history.*.role').optional().isIn(['user', 'assistant']),
  body('history.*.content').optional().isString().trim().isLength({ min: 1, max: 2000 }),
];

/**
 * Shared pre-flight: validation, small talk, retrieval.
 *
 * `grounded` on the returned plan tells the caller (and eventually the
 * client) whether the answer is backed by cited campus records (true),
 * is the model's own general knowledge because nothing matched (false),
 * or isn't an informational answer at all — small talk (null).
 */
async function prepare(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return { kind: 'invalid', details: errors.array() };
  }

  const { question } = req.body;
  const history = (req.body.history ?? []).slice(-HISTORY_TURNS);

  const creator = detectCreatorQuestion(question);
  if (creator) {
    return { kind: 'canned', answer: creator.answer, sources: [], grounded: null, card: { type: 'creator', ...creator.profile } };
  }

  const smallTalk = detectSmallTalk(question);
  if (smallTalk) {
    return { kind: 'canned', answer: smallTalk, sources: [], grounded: null };
  }

  const [searched, listed] = await Promise.all([
    retrieve(buildRetrievalQuery(question, history)),
    detectListIntent(question) === 'events' ? listUpcomingEvents() : null,
  ]);
  const { matched, sources, contextBlock } = mergeRetrievals(listed, searched);

  if (process.env.DEMO_MODE === 'true') {
    // No live model to fall back on here, so an unmatched question still
    // gets the flat refusal rather than a fabricated "general knowledge"
    // answer with nothing actually generating it.
    if (!matched) return { kind: 'canned', answer: NO_MATCH_ANSWER, sources: [], grounded: false };
    const demo = matchDemoResponse(question);
    return { kind: 'canned', ...(demo ?? { answer: NO_MATCH_ANSWER, sources: [] }), grounded: true };
  }

  if (!matched) {
    return { kind: 'generate', question, history, sources: [], contextBlock: '', mode: 'general' };
  }

  return { kind: 'generate', question, history, sources, contextBlock, mode: 'grounded' };
}

const router = Router();

router.post('/', chatLimiter, validators, async (req, res, next) => {
  try {
    const plan = await prepare(req);

    if (plan.kind === 'invalid') {
      return res.status(400).json({ error: 'Validation failed', details: plan.details });
    }
    if (plan.kind === 'canned') {
      return res.json({ answer: plan.answer, sources: plan.sources, grounded: plan.grounded, card: plan.card ?? null });
    }

    try {
      const answer = await askModel(plan.question, plan.contextBlock, plan.history, plan.mode);
      return res.json({ answer, sources: plan.sources, grounded: plan.mode === 'grounded' });
    } catch (err) {
      if (err instanceof ModelUnavailableError) {
        console.warn('Model unavailable, falling back to canned response:', err.message);
        const demo = matchDemoResponse(plan.question);
        return res.json(demo ?? { answer: NO_MATCH_ANSWER, sources: [], grounded: Boolean(demo) });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

router.post('/stream', chatLimiter, validators, async (req, res, next) => {
  let plan;
  try {
    plan = await prepare(req);
  } catch (err) {
    return next(err);
  }

  if (plan.kind === 'invalid') {
    return res.status(400).json({ error: 'Validation failed', details: plan.details });
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  if (plan.kind === 'canned') {
    send('meta', { sources: plan.sources, grounded: plan.grounded, card: plan.card ?? null });
    send('token', plan.answer);
    send('done', {});
    return res.end();
  }

  send('meta', { sources: plan.sources, grounded: plan.mode === 'grounded', card: null });

  try {
    for await (const delta of streamModel(plan.question, plan.contextBlock, plan.history, plan.mode)) {
      send('token', delta);
    }
    send('done', {});
  } catch (err) {
    if (err instanceof ModelUnavailableError) {
      console.warn('Model unavailable mid-stream, falling back:', err.message);
      const demo = matchDemoResponse(plan.question);
      send('token', demo?.answer ?? NO_MATCH_ANSWER);
      send('done', {});
    } else {
      send('error', { message: 'Something went wrong generating that answer.' });
    }
  }

  res.end();
});

export default router;
