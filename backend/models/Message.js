const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required'],
    index: true
  },
  senderId: {
    type: String,
    required: [true, 'Sender ID is required']
  },
  senderEmail: {
    type: String,
    required: [true, 'Sender email is required']
  },
  senderName: {
    type: String,
    required: [true, 'Sender name is required'],
    trim: true
  },
  userType: {
    type: String,
    enum: ['student', 'staff'],
    required: [true, 'User type is required']
  },
  text: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);