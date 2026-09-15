import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectTestDb, disconnectTestDb } from './helpers/testDb.js';
import { createAdminToken } from './helpers/authHelper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

// A minimal but genuinely valid 1x1 PNG, so multer's mimetype check passes.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

let app;
let token;
const writtenFiles = [];

beforeAll(async () => {
  await connectTestDb();
  ({ default: app } = await import('../src/index.js'));
  token = await createAdminToken(app);
});

afterAll(async () => {
  await disconnectTestDb();
  // Multer writes straight to the tracked public/images directory — clean
  // up anything this suite actually created there.
  for (const filename of writtenFiles) {
    await fs.promises.unlink(path.join(IMAGES_DIR, filename)).catch(() => {});
  }
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

    const filename = res.body.imageUrl.replace('/images/', '');
    writtenFiles.push(filename);
    const onDisk = await fs.promises.readFile(path.join(IMAGES_DIR, filename));
    expect(onDisk.equals(TINY_PNG)).toBe(true);
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
