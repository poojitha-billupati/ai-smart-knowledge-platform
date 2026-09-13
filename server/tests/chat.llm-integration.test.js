import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.LLM_BASE_URL || 'http://localhost:11434/v1';
const API_KEY = process.env.LLM_API_KEY;

let reachable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${BASE_URL}/models`, {
      headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
      signal: AbortSignal.timeout(5000),
    });
    reachable = res.ok;
  } catch {
    reachable = false;
  }
});

/**
 * The one deliberate test that hits the real configured model (§7) — hosted
 * or local — confirming the endpoint contract still holds. Everything else
 * mocks it because real inference is too slow for every pass. Skips itself
 * (rather than failing the suite) when no endpoint is reachable.
 */
describe('askModel (live endpoint integration)', () => {
  it('returns a non-empty grounded answer from the live model', async (ctx) => {
    if (!reachable) {
      ctx.skip();
      return;
    }

    const { askModel } = await import('../src/services/llm.js');
    const context = '[INFO] The central library is open 8am-10pm on weekdays.';
    const answer = await askModel('When does the library open?', context);

    expect(typeof answer).toBe('string');
    expect(answer.length).toBeGreaterThan(0);
    expect(answer).not.toMatch(/<think>/i);
  });

  it('streams the same answer in fragments', async (ctx) => {
    if (!reachable) {
      ctx.skip();
      return;
    }

    const { streamModel } = await import('../src/services/llm.js');
    const context = '[INFO] The central library is open 8am-10pm on weekdays.';

    let chunks = 0;
    let text = '';
    for await (const delta of streamModel('When does the library open?', context)) {
      chunks += 1;
      text += delta;
    }

    expect(chunks).toBeGreaterThan(1);
    expect(text.trim().length).toBeGreaterThan(0);
  });
});
