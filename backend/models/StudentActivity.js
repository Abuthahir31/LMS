const mongoose = require('mongoose');
const activitySchema = new mongoose.Schema({
  userId: String,
  email: String,
  type: String, 
  timestamp: { type: Date, default: Date.now },
  loggedOut: { type: Boolean, default: false }, 
  logoutTime: Date, 
  relatedLogin: mongoose.Schema.Types.ObjectId 
});

module.exports = mongoose.model('Activity', activitySchema);