import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  altText: { type: String, required: true },
  description: { type: String, trim: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedType: { type: String, enum: ['event', 'information'] },
});

export default mongoose.model('Image', imageSchema);
