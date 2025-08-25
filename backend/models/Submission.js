const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: String,
  path: String,
  type: String,
  size: Number,
  url: String
});

const submissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Assignment'
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Class'
  },
  studentId: {
    type: String,
    required: true
  },
  files: [fileSchema],
  answer: String,
  submitted: {
    type: Boolean,
    default: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  studentName: String
});

module.exports = mongoose.model('Submission', submissionSchema);