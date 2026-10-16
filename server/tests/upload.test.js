import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { connectTestDb, disconnectTestDb } from './helpers/testDb.js';
import { createAdminToken } from './helpers/authHelper.js';

// A minimal but genuinely valid 1x1 PNG, so multer's mimetype check passes.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

let app;
let token;

beforeAll(async () => {
  await connectTestDb();
  ({ default: app } = await import('../src/index.js'));
  token = await createAdminToken(app);
});

afterAll(async () => {
  await disconnectTestDb();
});

describe('POST /api/uploads', () => {
  it('requires auth (401 without token)', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .attach('image', TINY_PNG, { filename: 'pixel.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
  });

  it('stores a valid image and returns its new /images path', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', TINY_PNG, { filename: 'pixel.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.imageUrl).toMatch(/^\/images\/.+\.png$/);

    const served = await request(app).get(res.body.imageUrl).buffer(true).parse((r, cb) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toBe('image/png');
    expect(served.body.equals(TINY_PNG)).toBe(true);
  });

  it('returns 404 for an image that was never uploaded', async () => {
    const res = await request(app).get('/images/does-not-exist.png');

    expect(res.status).toBe(404);
  });

  it('rejects a non-image file (400)', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('not an image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
  });

  it('rejects a request with no file (400)', async () => {
    const res = await request(app).post('/api/uploads').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});
