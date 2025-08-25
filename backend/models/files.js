const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String },
  name: { type: String, required: true }, 
  type: { type: String, required: true }, 
  size: { type: String, required: true }, 
  lastModified: { type: String }, 
  isUploadedFile: { type: Boolean, default: true }, 
  isNotes: { type: Boolean, default: false }, 
  filePath: { type: String, required: false }, 
  content: { type: String }, 
});

module.exports = mongoose.model('File', fileSchema);