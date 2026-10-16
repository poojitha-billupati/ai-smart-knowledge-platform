import mongoose from 'mongoose';

const uploadedFileSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('UploadedFile', uploadedFileSchema);
