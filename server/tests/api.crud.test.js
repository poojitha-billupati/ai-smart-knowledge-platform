import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './helpers/testDb.js';
import { createAdminToken } from './helpers/authHelper.js';

let app;
let token;

beforeAll(async () => {
  await connectTestDb();
  ({ default: app } = await import('../src/index.js'));
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

const CASES = [
  {
    path: '/api/information',
    valid: { title: 'Fee Structure', description: 'Billed per semester.', category: 'Finance', tags: ['fees'] },
    invalid: { title: '' },
  },
  {
    path: '/api/events',
    valid: {
      title: 'Orientation',
      date: '2026-08-01T09:00:00.000Z',
      location: 'Auditorium',
      description: 'Welcome session for new students.',
    },
    invalid: { title: 'Missing fields' },
  },
  {
    path: '/api/faq',
    valid: { question: 'When?', answer: 'Every June.', category: 'Academics', keywords: ['when'] },
    invalid: { question: '' },
  },
  {
    path: '/api/images',
    valid: { title: 'Banner', imageUrl: '/images/banner.webp', category: 'Events', altText: 'A banner' },
    invalid: { title: '' },
  },
];

describe.each(CASES)('CRUD: $path', ({ path, valid, invalid }) => {
  beforeAll(async () => {
    token = await createAdminToken(app);
  });

  it('GET / returns an empty list initially', async () => {
    const res = await request(app).get(path);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST / requires auth (401 without token)', async () => {
    const res = await request(app).post(path).send(valid);
    expect(res.status).toBe(401);
  });

  it('POST / rejects invalid input (400)', async () => {
    const res = await request(app)
      .post(path)
      .set('Authorization', `Bearer ${token}`)
      .send(invalid);
    expect(res.status).toBe(400);
  });

  it('POST / creates a record (201), then GET /:id retrieves it', async () => {
    const created = await request(app)
      .post(path)
      .set('Authorization', `Bearer ${token}`)
      .send(valid);
    expect(created.status).toBe(201);
    expect(created.body._id).toBeDefined();

    const fetched = await request(app).get(`${path}/${created.body._id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body._id).toBe(created.body._id);
  });

  it('GET /:id returns 404 for an unknown id', async () => {
    const res = await request(app).get(`${path}/000000000000000000000000`);
    expect(res.status).toBe(404);
  });

  it('PUT /:id updates a record and requires auth', async () => {
    const created = await request(app)
      .post(path)
      .set('Authorization', `Bearer ${token}`)
      .send(valid);

    const unauth = await request(app).put(`${path}/${created.body._id}`).send(valid);
    expect(unauth.status).toBe(401);

    const updated = await request(app)
      .put(`${path}/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(valid);
    expect(updated.status).toBe(200);
  });

  it('DELETE /:id removes a record and requires auth', async () => {
    const created = await request(app)
      .post(path)
      .set('Authorization', `Bearer ${token}`)
      .send(valid);

    const unauth = await request(app).delete(`${path}/${created.body._id}`);
    expect(unauth.status).toBe(401);

    const deleted = await request(app)
      .delete(`${path}/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleted.status).toBe(204);

    const gone = await request(app).get(`${path}/${created.body._id}`);
    expect(gone.status).toBe(404);
  });
});

describe('POST /api/events registrationLink', () => {
  beforeAll(async () => {
    token = await createAdminToken(app);
  });

  const base = {
    title: 'Orientation',
    date: '2026-08-01T09:00:00.000Z',
    location: 'Auditorium',
    description: 'Welcome session for new students.',
  };

  it('accepts a valid http(s) URL and stores it', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...base, registrationLink: 'https://forms.example.com/orientation' });

    expect(res.status).toBe(201);
    expect(res.body.registrationLink).toBe('https://forms.example.com/orientation');
  });

  it('rejects a non-URL value (400)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...base, registrationLink: 'not a link' });

    expect(res.status).toBe(400);
  });

  it('is optional — omitting it still creates the event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(base);

    expect(res.status).toBe(201);
  });
});

describe('POST /api/images relatedId/relatedType/description', () => {
  beforeAll(async () => {
    token = await createAdminToken(app);
  });

  const base = {
    title: 'Banner',
    imageUrl: '/images/banner.webp',
    category: 'Events',
    altText: 'A banner',
  };
  const validEventId = '64a000000000000000000001';

  it('accepts description, relatedType and a well-formed relatedId together', async () => {
    const res = await request(app)
      .post('/api/images')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...base,
        description: 'Taken at last year\'s fest.',
        relatedType: 'event',
        relatedId: validEventId,
      });

    expect(res.status).toBe(201);
    expect(res.body.relatedType).toBe('event');
    expect(res.body.relatedId).toBe(validEventId);
  });

  it('is optional — omitting relatedType/relatedId/description still creates the image', async () => {
    const res = await request(app)
      .post('/api/images')
      .set('Authorization', `Bearer ${token}`)
      .send(base);

    expect(res.status).toBe(201);
  });

  it('rejects a malformed relatedId (400)', async () => {
    const res = await request(app)
      .post('/api/images')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...base, relatedType: 'event', relatedId: 'not-an-id' });

    expect(res.status).toBe(400);
  });

  it('a PUT with relatedType/relatedId set to null clears a previous link', async () => {
    const created = await request(app)
      .post('/api/images')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...base, relatedType: 'event', relatedId: validEventId });

    const updated = await request(app)
      .put(`/api/images/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...base, relatedType: null, relatedId: null });

    expect(updated.status).toBe(200);
    expect(updated.body.relatedType).toBeFalsy();
    expect(updated.body.relatedId).toBeFalsy();
  });
});

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
