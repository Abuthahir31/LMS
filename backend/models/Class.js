const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Class name is required'],
    trim: true
  },
  section: { 
    type: String, 
    trim: true 
  },
  subject: { 
    type: String, 
    trim: true 
  },
  teacher: { 
    type: String, 
    default: '',
    trim: true 
  },
  staffId: { 
    type: String, 
    required: [true, 'Staff ID is required'] 
  },
  color: { 
    type: String,
    enum: ['red', 'orange', 'green', 'blue', 'purple', 'teal', 'pink', 'indigo', 'cyan', 'amber'],
    default: 'blue'
  },
  initials: { 
    type: String,
    uppercase: true,
    minlength: 1,
    maxlength: 2
  },
  students: [{
    studentId: { 
      type: String, 
      required: true 
    },
    name: {
      type: String,
      default: 'Unknown'
    },
    email: {
      type: String,
      default: ''
    },
    rollNumber: {
      type: String,
      default: ''
    },
    batch: {
      type: String,
      default: ''
    },
    major: {
      type: String,
      default: ''
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  staff: [{
    staffId: { 
      type: String, 
      required: true 
    },
    name: {
      type: String,
      default: 'Unknown'
    },
    email: {
      type: String,
      default: ''
    },
    position: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

classSchema.pre('save', function(next) {
  if (!this.initials) {
    this.initials = this.name
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  next();
});

module.exports = mongoose.model('Class', classSchema);