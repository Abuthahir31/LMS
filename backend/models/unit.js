const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { 
    type: String, 
    default: () => new Date().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }) 
  },
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }], 
  classId: { type: String, required: true }
});

module.exports = mongoose.model('Unit', unitSchema);