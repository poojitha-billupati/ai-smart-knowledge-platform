import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  location: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  imageUrl: { type: String, trim: true },
  registrationLink: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

eventSchema.index({ title: 'text', description: 'text', location: 'text' });
eventSchema.index({ date: 1 });

export default mongoose.model('Event', eventSchema);
