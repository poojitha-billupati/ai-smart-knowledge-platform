import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { retrieve, listUpcomingEvents, mergeRetrievals } from '../services/retrieval.js';
import { askModel, streamModel, ModelUnavailableError } from '../services/llm.js';
import { matchDemoResponse } from '../services/demoResponses.js';
import { detectSmallTalk, buildRetrievalQuery, detectListIntent } from '../services/intent.js';

const NO_MATCH_ANSWER =
  "I don't have anything on file about that. I can help with admissions, fees and scholarships, hostel allotment, library and campus facilities, or upcoming events.";

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

/** Shared pre-flight: validation, small talk, retrieval. */
async function prepare(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return { kind: 'invalid', details: errors.array() };
  }

  const { question } = req.body;
  const history = (req.body.history ?? []).slice(-HISTORY_TURNS);

  const smallTalk = detectSmallTalk(question);
  if (smallTalk) {
    return { kind: 'canned', answer: smallTalk, sources: [] };
  }

  const [searched, listed] = await Promise.all([
    retrieve(buildRetrievalQuery(question, history)),
    detectListIntent(question) === 'events' ? listUpcomingEvents() : null,
  ]);
  const { matched, sources, contextBlock } = mergeRetrievals(listed, searched);

  if (!matched) {
    return { kind: 'canned', answer: NO_MATCH_ANSWER, sources: [] };
  }

  if (process.env.DEMO_MODE === 'true') {
    const demo = matchDemoResponse(question);
    return { kind: 'canned', ...(demo ?? { answer: NO_MATCH_ANSWER, sources: [] }) };
  }

  return { kind: 'generate', question, history, sources, contextBlock };
}

const router = Router();

router.post('/', chatLimiter, validators, async (req, res, next) => {
  try {
    const plan = await prepare(req);

    if (plan.kind === 'invalid') {
      return res.status(400).json({ error: 'Validation failed', details: plan.details });
    }
    if (plan.kind === 'canned') {
      return res.json({ answer: plan.answer, sources: plan.sources });
    }

    try {
      const answer = await askModel(plan.question, plan.contextBlock, plan.history);
      return res.json({ answer, sources: plan.sources });
    } catch (err) {
      if (err instanceof ModelUnavailableError) {
        console.warn('Model unavailable, falling back to canned response:', err.message);
        const demo = matchDemoResponse(plan.question);
        return res.json(demo ?? { answer: NO_MATCH_ANSWER, sources: [] });
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
    send('sources', plan.sources);
    send('token', plan.answer);
    send('done', {});
    return res.end();
  }

  send('sources', plan.sources);

  try {
    for await (const delta of streamModel(plan.question, plan.contextBlock, plan.history)) {
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
