const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    avatar: { type: String, default: 'Y' },
    avatarBg: { type: String, default: '#1a73e8' },
    title: { type: String, required: true },
    text: { type: String, required: true },
    link: { type: String },
    postedBy: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);