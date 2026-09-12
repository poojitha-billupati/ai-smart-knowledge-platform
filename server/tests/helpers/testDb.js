import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod;

/** Spins up an isolated in-memory MongoDB and points this process at it. */
export async function connectTestDb() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.NODE_ENV = 'test';
  process.env.DEMO_MODE = process.env.DEMO_MODE ?? 'false';
  await mongoose.connect(process.env.MONGO_URI);
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

export async function clearTestDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}
