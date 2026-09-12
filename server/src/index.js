import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import informationRouter from './routes/information.js';
import eventsRouter from './routes/events.js';
import imagesRouter from './routes/images.js';
import faqRouter from './routes/faq.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/information', informationRouter);
app.use('/api/events', eventsRouter);
app.use('/api/images', imagesRouter);
app.use('/api/faq', faqRouter);

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
