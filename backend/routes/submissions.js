const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get submission status for all assignments in a class for a student
router.get('/status/:classId/student/:studentId', async (req, res) => {
  try {
    const submissions = await Submission.find({
      classId: req.params.classId,
      studentId: req.params.studentId
    })
      .select('assignmentId submitted submissionDate answer files studentName')
      .populate('files', 'name url type size _id');

    const status = {};
    submissions.forEach(sub => {
      if (!status[sub.assignmentId]) {
        status[sub.assignmentId] = { submissions: [] };
      }
      // Only include submissions with content
      if (sub.answer || sub.files.length > 0) {
        status[sub.assignmentId].submissions.push({
          _id: sub._id,
          submitted: true,
          submissionDate: sub.submissionDate,
          answer: sub.answer,
          files: sub.files,
          studentName: sub.studentName
        });
      }
    });

    const assignments = await Assignment.find({ classId: req.params.classId });
    assignments.forEach(assignment => {
      if (!status[assignment._id]) {
        status[assignment._id] = { submissions: [] };
      }
    });

    res.json(status);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch submission status',
      error: err.message
    });
  }
});

// Create a new submission
router.post('/', upload.array('files'), async (req, res) => {
  try {
    const { assignmentId, classId, studentId, answer, studentName } = req.body;

    // Validate required fields
    if (!assignmentId || !classId || !studentId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const files = req.files.map(file => ({
      name: file.originalname,
      path: file.path,
      type: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    // Only create submission if there's content
    if (!answer && files.length === 0) {
      return res.status(400).json({ message: 'Submission must include an answer or files' });
    }

    const submission = new Submission({
      assignmentId,
      classId,
      studentId,
      answer,
      files,
      submitted: true,
      submissionDate: new Date(),
      studentName
    });

    await submission.save();
    res.status(201).json(submission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a submission
router.delete('/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Delete associated files from the filesystem
    for (const file of submission.files) {
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (fileErr) {
        console.error(`Failed to delete file ${file.path}:`, fileErr.message);
      }
    }

    await submission.deleteOne();
    res.json({ message: 'Submission deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a specific file from a submission
router.delete('/:submissionId/file/:fileId', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const fileIndex = submission.files.findIndex(file => file._id.toString() === req.params.fileId);
    if (fileIndex === -1) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = submission.files[fileIndex];
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (fileErr) {
      console.error(`Failed to delete file ${file.path}:`, fileErr.message);
    }

    submission.files.splice(fileIndex, 1);

    // Delete submission if it has no content left
    if (!submission.answer && submission.files.length === 0) {
      await submission.deleteOne();
      return res.json({ message: 'File and empty submission deleted successfully' });
    }

    await submission.save();
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
