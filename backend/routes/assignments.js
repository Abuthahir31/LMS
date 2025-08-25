const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const fs = require('fs');

// Get all assignments for a class and staff
router.get('/:classId/staff/:staffId', async (req, res) => {
  try {
    const assignments = await Assignment.find({
      classId: req.params.classId,
      staffId: req.params.staffId
    }).sort({ createdAt: -1 });

    // Calculate unique student count for each assignment
    const assignmentsWithStudentCount = await Promise.all(assignments.map(async (assignment) => {
      const submissions = await Submission.find({ assignmentId: assignment._id });
      const uniqueStudentIds = [...new Set(submissions.map(sub => sub.studentId))];
      return {
        ...assignment.toObject(),
        uniqueStudentCount: uniqueStudentIds.length
      };
    }));

    res.json(assignmentsWithStudentCount);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch assignments',
      error: err.message
    });
  }
});



// Get all assignments for a class (for students)
router.get('/:classId/student/:studentId', async (req, res) => {
  try {
    const assignments = await Assignment.find({
      classId: req.params.classId
    }).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch assignments',
      error: err.message
    });
  }
});

// Create a new assignment
router.post('/staff/:staffId', async (req, res) => {
  try {
    const { meetLink, type } = req.body;

    // Validate meetLink based on type
    let validatedMeetLink = meetLink;
    if (type.includes('meet')) {
      if (!meetLink) {
        if (type === 'meet-google') {
          validatedMeetLink = 'https://meet.google.com/new';
        } else if (type === 'meet-zoom') {
          return res.status(400).json({
            message: 'Zoom meeting link is required.',
          });
        } else if (type === 'meet-teams') {
          return res.status(400).json({
            message: 'Microsoft Teams meeting link is required.',
          });
        }
      } else {
        // Basic URL validation
        const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
        if (!urlRegex.test(meetLink)) {
          return res.status(400).json({
            message: 'Invalid meeting link provided.',
          });
        }
        // Optional: Add specific validation for Zoom and Teams URLs
        if (type === 'meet-zoom' && !meetLink.includes('zoom.us')) {
          return res.status(400).json({
            message: 'Invalid Zoom meeting link.',
          });
        }
        if (type === 'meet-teams' && !meetLink.includes('teams.microsoft.com')) {
          return res.status(400).json({
            message: 'Invalid Microsoft Teams meeting link.',
          });
        }
      }
    }

    const assignment = new Assignment({
      classId: req.body.classId,
      staffId: req.params.staffId,
      type: type,
      title: req.body.title,
      description: req.body.description,
      assignmentType: req.body.assignmentType,
      question: req.body.question,
      formLink: req.body.formLink,
      meetTime: req.body.meetTime,
      meetLink: validatedMeetLink,
    });

    const newAssignment = await assignment.save();
    res.status(201).json(newAssignment);
  } catch (err) {
    res.status(400).json({
      message: 'Failed to create assignment',
      error: err.message,
    });
  }
});

// Update an assignment
router.put('/:id/staff/:staffId', async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      staffId: req.params.staffId,
    });
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found or you are not authorized' });
    }

    const { meetLink, type, title, description, assignmentType, question, formLink, meetTime } = req.body;

    // Validate meetLink based on type
    let validatedMeetLink = meetLink || assignment.meetLink;
    if (type.includes('meet')) {
      if (!validatedMeetLink) {
        if (type === 'meet-google') {
          validatedMeetLink = 'https://meet.google.com/new';
        } else if (type === 'meet-zoom') {
          return res.status(400).json({
            message: 'Zoom meeting link is required.',
          });
        } else if (type === 'meet-teams') {
          return res.status(400).json({
            message: 'Microsoft Teams meeting link is required.',
          });
        }
      } else {
        // Basic URL validation
        const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
        if (!urlRegex.test(validatedMeetLink)) {
          return res.status(400).json({
            message: 'Invalid meeting link provided.',
          });
        }
        // Optional: Add specific validation for Zoom and Teams URLs
        if (type === 'meet-zoom' && !validatedMeetLink.includes('zoom.us')) {
          return res.status(400).json({
            message: 'Invalid Zoom meeting link.',
          });
        }
        if (type === 'meet-teams' && !validatedMeetLink.includes('teams.microsoft.com')) {
          return res.status(400).json({
            message: 'Invalid Microsoft Teams meeting link.',
          });
        }
      }
    }

    assignment.type = type || assignment.type;
    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.assignmentType = assignmentType || assignment.assignmentType;
    assignment.question = question || assignment.question;
    assignment.formLink = formLink || assignment.formLink;
    assignment.meetTime = meetTime || assignment.meetTime;
    assignment.meetLink = validatedMeetLink;

    const updatedAssignment = await assignment.save();
    res.json(updatedAssignment);
  } catch (err) {
    res.status(400).json({
      message: 'Failed to update assignment',
      error: err.message,
    });
  }
});

// Delete an assignment
router.delete('/:id/staff/:staffId', async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      staffId: req.params.staffId
    });
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found or you are not authorized' });
    }

    // Delete associated submissions and their files
    const submissions = await Submission.find({ assignmentId: req.params.id });
    for (const submission of submissions) {
      for (const file of submission.files) {
        try {
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (fileErr) {
          console.error(`Failed to delete file ${file.path}:`, fileErr.message);
        }
      }
    }
    await Submission.deleteMany({ assignmentId: req.params.id });
    await Assignment.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Assignment and associated submissions deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to delete assignment',
      error: err.message
    });
  }
});

// Get all submissions for an assignment
router.get('/:id/submissions', async (req, res) => {
  try {
    const submissions = await Submission.find({ assignmentId: req.params.id })
      .sort({ submissionDate: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch submissions',
      error: err.message
    });
  }
});



module.exports = router;