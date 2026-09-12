import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import informationRouter from './routes/information.js';
import eventsRouter from './routes/events.js';
import imagesRouter from './routes/images.js';
import faqRouter from './routes/faq.js';
import chatRouter from './routes/chat.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/information', informationRouter);
app.use('/api/events', eventsRouter);
app.use('/api/images', imagesRouter);
app.use('/api/faq', faqRouter);
app.use('/api/chat', chatRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

export async function start() {
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } else {
    console.warn('MONGO_URI not set — skipping MongoDB connection');
  }
  return app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;
