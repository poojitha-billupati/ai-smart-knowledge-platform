import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  keywords: { type: [String], default: [] },
});

faqSchema.index({ question: 'text', answer: 'text', keywords: 'text' });

export default mongoose.model('Faq', faqSchema);
