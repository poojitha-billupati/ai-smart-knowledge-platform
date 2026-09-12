import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';

const BCRYPT_COST = 10;

/** Creates or updates the single seeded admin account (§6) — no public registration. */
export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in server/.env before seeding');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  await User.findOneAndUpdate(
    { email },
    { name: 'Admin', email, passwordHash, role: 'admin' },
    { upsert: true, new: true },
  );

  console.log(`Admin account ready: ${email}`);
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set — configure server/.env before seeding');
  }
  await mongoose.connect(process.env.MONGO_URI);
  await seedAdmin();
  await mongoose.disconnect();
}

const isMainModule = process.argv[1] && process.argv[1].endsWith('seedAdmin.js');
if (isMainModule) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
