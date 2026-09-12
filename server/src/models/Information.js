import mongoose from 'mongoose';

const informationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

informationSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Information', informationSchema);
