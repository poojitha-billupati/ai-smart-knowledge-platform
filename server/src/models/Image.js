import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  altText: { type: String, required: true },
  description: { type: String, trim: true },
  // Event banners live on the Event document itself (Event.imageUrl) — this
  // is only for a gallery photo that illustrates a knowledge-base record.
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedType: { type: String, enum: ['information'] },
});

export default mongoose.model('Image', imageSchema);
