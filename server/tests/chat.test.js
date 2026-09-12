import { beforeAll, afterAll, afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './helpers/testDb.js';

vi.mock('../src/services/ollama.js', async () => {
  const actual = await vi.importActual('../src/services/ollama.js');
  return { ...actual, askOllama: vi.fn() };
});

let app;
let Information;
let askOllama;
let OllamaUnavailableError;

beforeAll(async () => {
  await connectTestDb();
  ({ default: app } = await import('../src/index.js'));
  ({ default: Information } = await import('../src/models/Information.js'));
  ({ askOllama, OllamaUnavailableError } = await import('../src/services/ollama.js'));
});

beforeEach(async () => {
  askOllama.mockReset();
  process.env.DEMO_MODE = 'false';
  await Information.create({
    title: 'Library Hours',
    description: 'The central library is open 8am-10pm on weekdays.',
    category: 'Facilities',
    tags: ['library', 'hours'],
  });
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe('POST /api/chat', () => {
  it('rejects an empty question (validation)', async () => {
    const res = await request(app).post('/api/chat').send({ question: '' });
    expect(res.status).toBe(400);
    expect(askOllama).not.toHaveBeenCalled();
  });

  it('success: matched question calls Ollama and returns its answer with sources', async () => {
    askOllama.mockResolvedValueOnce('The library opens at 8am on weekdays.');

    const res = await request(app).post('/api/chat').send({ question: 'When does the library open?' });

    expect(res.status).toBe(200);
    expect(res.body.answer).toBe('The library opens at 8am on weekdays.');
    expect(res.body.sources.length).toBeGreaterThan(0);
    expect(askOllama).toHaveBeenCalledTimes(1);
  });

  it('empty-context: a question matching nothing never calls Ollama', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ question: 'What is the airspeed velocity of an unladen swallow?' });

    expect(res.status).toBe(200);
    expect(res.body.answer).toMatch(/don't have that information/i);
    expect(res.body.sources).toEqual([]);
    expect(askOllama).not.toHaveBeenCalled();
  });

  it('model timeout: falls back to a canned response instead of erroring', async () => {
    askOllama.mockRejectedValueOnce(new OllamaUnavailableError('This operation was aborted'));

    const res = await request(app).post('/api/chat').send({ question: 'When does the library open?' });

    expect(res.status).toBe(200);
    expect(res.body.answer).toMatch(/library/i);
  });

  it('Ollama not running: a connection failure falls back the same way', async () => {
    askOllama.mockRejectedValueOnce(new OllamaUnavailableError('fetch failed'));

    const res = await request(app).post('/api/chat').send({ question: 'When does the library open?' });

    expect(res.status).toBe(200);
    expect(res.body.answer).toMatch(/library/i);
  });

  it('an unexpected (non-Ollama) error is passed to the error handler', async () => {
    askOllama.mockRejectedValueOnce(new Error('boom'));

    const res = await request(app).post('/api/chat').send({ question: 'When does the library open?' });

    expect(res.status).toBe(500);
  });

  it('DEMO_MODE=true skips Ollama entirely and uses the canned response', async () => {
    process.env.DEMO_MODE = 'true';

    const res = await request(app).post('/api/chat').send({ question: 'When does the library open?' });

    expect(res.status).toBe(200);
    expect(res.body.answer).toMatch(/library/i);
    expect(askOllama).not.toHaveBeenCalled();
  });
});
