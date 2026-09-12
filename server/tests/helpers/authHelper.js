import request from 'supertest';
import bcrypt from 'bcrypt';
import User from '../../src/models/User.js';

const ADMIN_EMAIL = 'admin@test.local';
const ADMIN_PASSWORD = 'test-pass-123';

/** Seeds an admin user and returns a valid JWT for it, via the real login route. */
export async function createAdminToken(app) {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.create({ name: 'Admin', email: ADMIN_EMAIL, passwordHash, role: 'admin' });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  return res.body.token;
}
