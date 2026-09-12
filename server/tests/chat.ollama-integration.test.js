import { describe, it, expect, beforeAll } from 'vitest';

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';

let ollamaReachable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${OLLAMA_URL}/models`, { signal: AbortSignal.timeout(2000) });
    ollamaReachable = res.ok;
  } catch {
    ollamaReachable = false;
  }
});

/**
 * The one deliberate test that hits a real, running Ollama (§7) — confirms
 * the endpoint contract still holds. Everything else mocks Ollama because
 * real inference is too slow to run on every test pass. Skips itself
 * (rather than failing the suite) when Ollama isn't running locally.
 */
describe('askOllama (real Ollama integration)', () => {
  it('returns a non-empty grounded answer from the live model', async (ctx) => {
    if (!ollamaReachable) {
      ctx.skip();
      return;
    }

    const { askOllama } = await import('../src/services/ollama.js');
    const context = '[INFO] The central library is open 8am-10pm on weekdays.';
    const answer = await askOllama('When does the library open?', context);

    expect(typeof answer).toBe('string');
    expect(answer.length).toBeGreaterThan(0);
    expect(answer).not.toMatch(/<think>/i);
  });
});
