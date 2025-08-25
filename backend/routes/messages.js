const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Class = require('../models/Class');

// Get all messages for a class
router.get('/:classId/messages', async (req, res) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid class ID format'
      });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    const messages = await Message.find({ classId })
      .sort({ timestamp: 1 })
      .lean();

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: `Failed to fetch messages: ${error.message}`
    });
  }
});

// Post a new message
router.post('/:classId/messages', async (req, res) => {
  try {
    const { classId } = req.params;
    const { senderId, senderEmail, senderName, userType, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid class ID format'
      });
    }

    if (!senderId || !senderEmail || !senderName || !userType || !text) {
      return res.status(400).json({
        success: false,
        error: 'Sender ID, email, name, user type, and message text are required'
      });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Verify user is part of the class
    const isAuthorized = 
      (userType === 'staff' && (classData.staffId === senderId || classData.staff.some(s => s.staffId === senderId))) ||
      (userType === 'student' && classData.students.some(s => s.studentId === senderId || s.email === senderEmail));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: User not part of this class'
      });
    }

    const newMessage = new Message({
      classId,
      senderId,
      senderEmail,
      senderName,
      userType,
      text
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error posting message:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: `Failed to post message: ${error.message}`
    });
  }
});

// Delete all messages for a class (staff only)
router.delete('/:classId/messages', async (req, res) => {
  try {
    const { classId } = req.params;
    const { staffId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid class ID format'
      });
    }

    if (!staffId) {
      return res.status(400).json({
        success: false,
        error: 'Staff ID is required'
      });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Verify user is staff of this class
    if (classData.staffId !== staffId && !classData.staff.some(s => s.staffId === staffId)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only class staff can delete all messages'
      });
    }

    const result = await Message.deleteMany({ classId });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: 'All messages deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting all messages:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: `Failed to delete all messages: ${error.message}`
    });
  }
});

// Delete a specific message (staff can delete any message)
router.delete('/:classId/messages/:messageId', async (req, res) => {
  try {
    const { classId, messageId } = req.params;
    const { staffId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }

    if (!staffId) {
      return res.status(400).json({
        success: false,
        error: 'Staff ID is required'
      });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Verify user is staff of this class (staff can delete any message)
    const isStaff = classData.staffId === staffId || classData.staff.some(s => s.staffId === staffId);
    
    if (!isStaff) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Only staff can delete messages'
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: `Failed to delete message: ${error.message}`
    });
  }
});

module.exports = router;