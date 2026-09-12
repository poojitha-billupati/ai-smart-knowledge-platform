import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './helpers/testDb.js';

let retrieve;
let Information;
let Event;
let Faq;

beforeAll(async () => {
  await connectTestDb();
  ({ retrieve } = await import('../src/services/retrieval.js'));
  ({ default: Information } = await import('../src/models/Information.js'));
  ({ default: Event } = await import('../src/models/Event.js'));
  ({ default: Faq } = await import('../src/models/Faq.js'));
  // Mongoose builds indexes asynchronously after connect — $text queries
  // fail until the text index exists, so wait for it explicitly.
  await Promise.all([Information.init(), Event.init(), Faq.init()]);
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe('retrieve()', () => {
  it('matches a question against seeded information and returns sources + context', async () => {
    await Information.create({
      title: 'Library Hours',
      description: 'The central library is open 8am-10pm on weekdays.',
      category: 'Facilities',
      tags: ['library', 'hours'],
    });

    const result = await retrieve('When does the library open?');

    expect(result.matched).toBe(true);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources[0]).toMatchObject({ type: 'INFO', title: 'Library Hours' });
    expect(result.contextBlock).toContain('library');
  });

  it('returns no-match for a question with nothing in the knowledge base', async () => {
    await Information.create({
      title: 'Library Hours',
      description: 'The central library is open 8am-10pm on weekdays.',
      category: 'Facilities',
      tags: ['library', 'hours'],
    });

    const result = await retrieve('What is the airspeed velocity of an unladen swallow?');

    expect(result.matched).toBe(false);
    expect(result.sources).toEqual([]);
    expect(result.contextBlock).toBe('');
  });

  it('falls back to tag matching for a single keyword the text index scores poorly', async () => {
    await Faq.create({
      question: 'How do I apply for a hostel room?',
      answer: 'Apply through the student portal before July.',
      category: 'Facilities',
      keywords: ['hostel', 'housing', 'room'],
    });

    const result = await retrieve('hostel');

    expect(result.matched).toBe(true);
    expect(result.sources.some((s) => s.type === 'FAQ')).toBe(true);
  });

  it('merges and scores across information, events, and faq', async () => {
    await Promise.all([
      Information.create({
        title: 'AI Workshop Info',
        description: 'Details about the AI workshop registration.',
        category: 'Events',
        tags: ['ai', 'workshop'],
      }),
      Event.create({
        title: 'AI Workshop',
        date: new Date('2026-10-14'),
        location: 'Main Auditorium',
        description: 'Hands-on AI workshop for students.',
      }),
      Faq.create({
        question: 'How do I register for the AI workshop?',
        answer: 'Register on the events page.',
        category: 'Events',
        keywords: ['ai', 'workshop', 'registration'],
      }),
    ]);

    const result = await retrieve('Tell me about the AI workshop');

    expect(result.matched).toBe(true);
    const types = new Set(result.sources.map((s) => s.type));
    expect(types.size).toBeGreaterThan(1);
  });

  it('returns no-match against an empty database', async () => {
    const result = await retrieve('anything at all');
    expect(result.matched).toBe(false);
  });
});
