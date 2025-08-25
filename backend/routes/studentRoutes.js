const express = require('express');
const router = express.Router();
const Student = require('../models/Students');

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({});
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch students: ' + err.message 
    });
  }
});

// Add new student
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is required' 
      });
    }

    const existingStudent = await Student.findOne({ email: email.toLowerCase() });
    if (existingStudent) {
      return res.status(400).json({ 
        success: false,
        error: 'Student email already exists in database' 
      });
    }

    const newStudent = new Student({ email: email.toLowerCase() });
    await newStudent.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Student added successfully',
      data: newStudent
    });
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add student: ' + err.message 
    });
  }
});

// Delete student by email
router.delete('/:email', async (req, res) => {
  try {
    const email = req.params.email;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Email parameter is required' 
      });
    }

    const result = await Student.deleteOne({ email: email.toLowerCase() });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found with the provided email' 
      });
    }

    res.json({ 
      success: true,
      message: 'Student deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete student: ' + err.message 
    });
  }
});

module.exports = router;