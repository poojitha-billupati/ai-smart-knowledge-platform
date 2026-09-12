import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { connectTestDb, disconnectTestDb, clearTestDb } from './helpers/testDb.js';
import User from '../src/models/User.js';

let app;

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

async function seedAdmin(email = 'admin@test.local', password = 'correct-password') {
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name: 'Admin', email, passwordHash, role: 'admin' });
}

describe('POST /api/auth/login', () => {
  it('rejects a login for a user that does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.local', password: 'whatever' });
    expect(res.status).toBe(401);
  });

  it('rejects an incorrect password', async () => {
    await seedAdmin();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.local', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects malformed input', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: '' });
    expect(res.status).toBe(400);
  });

  it('issues a JWT for correct credentials', async () => {
    await seedAdmin();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.local', password: 'correct-password' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({ name: 'Admin', email: 'admin@test.local', role: 'admin' });
  });
});

describe('requireAdmin', () => {
  it('rejects a malformed/garbage token', async () => {
    const res = await request(app)
      .post('/api/information')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({ title: 'x', description: 'y', category: 'z' });
    expect(res.status).toBe(401);
  });
});
