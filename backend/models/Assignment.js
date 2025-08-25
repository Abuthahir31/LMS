const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  classId: {
    type: String,
    required: true
  },
  staffId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['assignment', 'meet-google', 'meet-zoom', 'meet-teams'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  assignmentType: {
    type: String,
    enum: ['question', 'form', null],
    default: null
  },
  question: {
    type: String,
    default: null
  },
  formLink: {
    type: String,
    default: null
  },
  meetTime: {
    type: String,
    default: null
  },
  meetLink: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Assignment', assignmentSchema);