const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Class = require('../models/Class');
const Staff = require('../models/Staff');
const Student = require('../models/Students');



// Create a new class
router.post('/', async (req, res) => {
  try {
    const { name, section, subject, teacher, staffId, email, position, department, phone } = req.body;

    if (!name || !staffId || !email) {
      return res.status(400).json({ 
        success: false,
        error: 'Class name, staff ID, and email are required' 
      });
    }

    const newClass = new Class({
      name,
      section,
      subject,
      teacher: teacher || '',
      staffId,
      color: req.body.color || 'blue',
      staff: [{
        staffId,
        name: teacher || email.split('@')[0] || 'Unknown',
        email,
        position: position || '',
        department: department || '',
        phone: phone || '',
        joinedAt: new Date()
      }],
      students: []
    });

    await newClass.save();
    
    res.status(201).json({
      success: true,
      class: newClass
    });
  } catch (error) {
    console.error('Error creating class:', error.message, error.stack);
    res.status(500).json({ 
      success: false,
      error: `Failed to create class: ${error.message}`
    });
  }
});

// Get all classes or classes for a specific staff member
router.get('/', async (req, res) => {
  try {
    const { staffId } = req.query;
    
    let query = {};
    if (staffId) {
      query.$or = [
        { staffId },
        { 'staff.staffId': staffId }
      ];
    }

    const classes = await Class.find(query).sort({ createdAt: -1 });
    res.json({ 
      success: true,
      classes 
    });
  } catch (error) {
    console.error('Error fetching classes:', error.message, error.stack);
    res.status(500).json({ 
      success: false,
      error: `Failed to fetch classes: ${error.message}`
    });
  }
});



// Join a class
router.post('/join', async (req, res) => {
  try {
    const { classCode, studentId, name, email, rollNumber, batch, major } = req.body;
    if (!classCode || !studentId || !email) {
      return res.status(400).json({ 
        success: false,
        error: 'Class code, student ID, and email are required' 
      });
    }

    const classToJoin = await Class.findById(classCode);
    if (!classToJoin) {
      return res.status(404).json({ 
        success: false,
        error: 'Class not found' 
      });
    }

    const alreadyJoined = classToJoin.students.some(
      student => student.studentId === studentId
    );

    if (alreadyJoined) {
      return res.status(400).json({  
        success: false,
        error: 'Student already joined this class' 
      });
    }
    classToJoin.students.push({
      studentId,
      name: name || email.split('@')[0] || 'Unknown',
      email,
      rollNumber: rollNumber || '',
      batch: batch || '',
      major: major || '',
      joinedAt: new Date()
    });

    await classToJoin.save();

    res.status(200).json({ 
      success: true,
      class: classToJoin,
      message: 'Successfully joined class'
    });
  } catch (error) {
    console.error('Error joining class:', error.message, error.stack);
    res.status(500).json({ 
      success: false,
      error: `Failed to join class: ${error.message}`
    });
  }
});

// Verify class for sharing
router.get('/:id/verify', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid ID format' 
      });
    }

    const classToShare = await Class.findById(req.params.id);
    if (!classToShare) {
      return res.status(404).json({ 
        success: false,
        error: 'Class not found' 
      });
    }

    res.json({ 
      success: true,
      class: classToShare,
      message: 'Class verified and ready for sharing'
    });
  } catch (error) {
    console.error('Error verifying class:', error.message, error.stack);
    res.status(500).json({ 
      success: false,
      error: `Failed to verify class: ${error.message}`
    });
  }
});

// Get class details for a specific staff member
router.get('/:classId/staff/:staffId', async (req, res) => {
  try {
    const { classId, staffId } = req.params;

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

    // Verify if the staffId is part of the class
    const isAuthorized = classData.staffId === staffId || classData.staff.some(s => s.staffId === staffId);
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: Staff member does not have access to this class' 
      });
    }

    res.json({ 
      success: true,
      class: classData 
    });
  } catch (error) {
    console.error('Error fetching class details:', error.message, error.stack);
    res.status(500).json({ 
      success: false,
      error: `Failed to fetch class details: ${error.message}`
    });
  }
});

// // Add this helper function at the top of the file
function extractNameFromEmail(email) {
  if (!email) return 'Unknown User';
  const username = email.split('@')[0];
  // Remove numbers and special characters, then split by dots/underscores
  const cleanName = username.replace(/[0-9._-]+/g, ' ');
  // Capitalize first letter of each word
  return cleanName.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim() || 'Unknown User';
}

// Update the people route to use email-derived names when database names aren't available
router.get('/:classId/people/staff/:staffId', async (req, res) => {
  try {
    const { classId, staffId } = req.params;

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

    // Verify if the staffId is part of the class
    const isAuthorized = classData.staffId === staffId || classData.staff.some(s => s.staffId === staffId);
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: Staff member does not have access to this class' 
      });
    }

    // Combine staff and students into a single people array with names derived from email if needed
    const people = [
      ...(classData.staff || []).map(s => ({
        id: s.staffId,
        name: s.name || extractNameFromEmail(s.email),
        email: s.email || 'N/A',
        role: 'staff',
        position: s.position || '',
        department: s.department || '',
        phone: s.phone || '',
        pinned: false
      })),
      ...(classData.students || []).map(s => ({
        id: s.studentId,
        name: s.name || extractNameFromEmail(s.email),
        email: s.email || 'N/A',
        role: 'student',
        rollNumber: s.rollNumber || '',
        batch: s.batch || '',
        major: s.major || '',
        pinned: false
      }))
    ];

    res.json({ 
      success: true,
      people,
      className: classData.name
    });
  } catch (error) {
    console.error('Error fetching people:', error.message, error.stack);
    res.status(500).json({ 
      success: false,
      error: `Failed to fetch people: ${error.message}`
    });
  }
});

// Invite a person to a class
router.post('/:classId/invite/staff/:staffId', async (req, res) => {
  try {
    const { classId, staffId } = req.params;
    const { email, role, message, name, position, department, phone, rollNumber, batch, major } = req.body;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid class ID format' 
      });
    }

    if (!email || !role) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and role are required' 
      });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ 
        success: false,
        error: 'Class not found' 
      });
    }

    // Verify if the staffId is part of the class
    const isAuthorized = classData.staffId === staffId || classData.staff.some(s => s.staffId === staffId);
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: Staff member does not have access to this class' 
      });
    }

    // Check if person already exists
    const alreadyExists = classData.staff.some(s => s.email === email) || 
                         classData.students.some(s => s.email === email);
    if (alreadyExists) {
      return res.status(400).json({ 
        success: false,
        error: 'This person is already in the class' 
      });
    }

    // Generate a unique ID (temporary; replace with Firebase UID in production)
    const personId = `${role}_${Date.now()}`; // Replace with actual Firebase UID if available

    const person = {
      id: personId,
      name: name || email.split('@')[0],
      email,
      role,
      pinned: false
    };

    if (role === 'staff') {
      classData.staff.push({
        staffId: personId,
        name: name || email.split('@')[0],
        email,
        position: position || '',
        department: department || '',
        phone: phone || '',
        joinedAt: new Date()
      });
      person.position = position || '';
      person.department = department || '';
      person.phone = phone || '';
    } else {
      classData.students.push({
        studentId: personId,
        name: name || email.split('@')[0],
        email,
        rollNumber: rollNumber || '',
        batch: batch || '',
        major: major || '',
        joinedAt: new Date()
      });
      person.rollNumber = rollNumber || '';
      person.batch = batch || '';
      person.major = major || '';
    }

    await classData.save();

    res.json({ 
      success: true,
      person,
      message: `Invite sent to ${email}`
    });
  } catch (error) {
    console.error('Error inviting person:', error.message, error.stack);
    res.status(500).json({ 
      success: false,
      error: `Failed to invite person: ${error.message}`
    });
  }
});

// Remove a person from a class
router.delete('/:classId/people/:personId/staff/:staffId', async (req, res) => {
  try {
    const { classId, personId, staffId } = req.params;

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

    // Verify if the staffId is part of the class
    const isAuthorized = classData.staffId === staffId || classData.staff.some(s => s.staffId === staffId);
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: Staff member does not have access to this class' 
      });
    }

    // Check if person exists in staff or students
    const staffIndex = classData.staff.findIndex(s => s.staffId === personId);
    const studentIndex = classData.students.findIndex(s => s.studentId === personId);

    if (staffIndex === -1 && studentIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Person not found in this class' 
      });
    }

    if (staffIndex !== -1) {
      classData.staff.splice(staffIndex, 1);
    } else {
      classData.students.splice(studentIndex, 1);
    }

    await classData.save();

    res.json({ 
      success: true,
      message: 'Person removed successfully'
    });
  } catch (error) {
    console.error('Error removing person:', error.message, error.stack);
    res.status(500).json({ 
      success: false,
      error: `Failed to remove person: ${error.message}`
    });
  }
});

// Update a class
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid ID format' 
      });
    }

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ 
        success: false,
        error: 'Class not found' 
      });
    }

    res.json({ 
      success: true,
      class: updatedClass 
    });
  } catch (error) {
    console.error('Error updating class:', error.message, error.stack);
    res.status(500).json({ 
      success: false,
      error: `Failed to update class: ${error.message}`
    });
  }
});

// Delete a class
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid ID format' 
      });
    }

    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    if (!deletedClass) {
      return res.status(404).json({ 
        success: false,
        error: 'Class not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting class:', error.message, error.stack);
    res.status(500).json({ 
      success: false,
      error: `Failed to delete class: ${error.message}`
    });
  }
});

// Add this route for enrollment verification
router.get('/:classId/students/:studentId', async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const { email } = req.query;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.json({ isEnrolled: false });
    }

    const isEnrolled = classData.students.some(s => 
      s.studentId === studentId || s.email === email
    );

    res.json({ isEnrolled });
    
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'Enrollment check failed' 
    });
  }
});

router.get('/:classId/people/student/:studentId', async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const { email } = req.query;

    // Validate inputs
    if (!email || email === 'undefined') {
      return res.status(400).json({ 
        success: false,
        error: 'Valid email is required' 
      });
    }

    // Find class and validate
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ 
        success: false,
        error: 'Class not found' 
      });
    }

    // Verify student enrollment (more flexible check)
    const isEnrolled = classData.students.some(student => 
      (student.studentId === studentId || student.email === email)
    );

    if (!isEnrolled) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: Student not enrolled in this class' 
      });
    }

    // Prepare response data
    const response = {
      success: true,
      people: [
        ...(classData.staff || []).map(s => ({
          id: s.staffId,
          name: s.name,
          email: s.email,
          role: 'staff'
        })),
        ...(classData.students || []).map(s => ({
          id: s.studentId,
          name: s.name,
          email: s.email,
          role: 'student'
        }))
      ],
      className: classData.name
    };

    res.json(response);

  } catch (error) {
    console.error('Error in /people route:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching class people' 
    });
  }
});

// New POST route to add a student to a classroom
router.post('/:classId/people/staff/:staffId', async (req, res) => {
  try {
    const { classId, staffId } = req.params;
    const { studentEmail } = req.body;

    // Validate input
    if (!studentEmail) {
      return res.status(400).json({ 
        success: false,
        error: 'Student email is required' 
      });
    }

    // Check if the classroom exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ 
        success: false,
        error: 'Class not found' 
      });
    }

    // Verify if the staffId is part of the class
      const isAuthorized = classData.staffId === staffId || classData.staff.some(s => s.staffId === staffId);
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: Staff member does not have access to this class' 
      });
    }

    // Find the student by email
    const student = await Student.findOne({ email: studentEmail });
    if (!student) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found with the provided email' 
      });
    }

    // Check if the student is already in the classroom
    const alreadyJoined = classData.students.some(s => s.studentId === student._id.toString());
    if (alreadyJoined) {
      return res.status(400).json({ 
        success: false,
        error: 'Student is already in the classroom' 
      });
    }

    // Add the student to the classroom
    classData.students.push({
      studentId: student._id.toString(),
      name: student.name || studentEmail.split('@')[0] || 'Unknown',
      email: studentEmail,
      rollNumber: student.rollNumber || '',
      batch: student.batch || '',
      major: student.major || '',
      joinedAt: new Date()
    });
    await classData.save();

    res.status(200).json({ 
      success: true,
      message: `Student ${student.email} successfully added to class ${classId}`,
      data: { studentId: student._id, classroomId: classId }
    });
  } catch (err) {
    console.error('Error adding student to classroom:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add student: ' + err.message 
    });
  }
});


// Existing GET route to fetch all students
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



router.post('/:classId/people/staff/:staffId', async (req, res) => {
  try {
    const { classId, staffId } = req.params;
    const { studentEmail } = req.body;

    // Validate input
    if (!studentEmail) {
      return res.status(400).json({ 
        success: false,
        error: 'Student email is required' 
      });
    }

    // Check if the classroom exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ 
        success: false,
        error: 'Class not found' 
      });
    }

    // Verify if the staffId is part of the class
    const isAuthorized = classData.staffId === staffId || classData.staff.some(s => s.staffId === staffId);
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: Staff member does not have access to this class' 
      });
    }

    // Find the student by email
    const student = await Student.findOne({ email: studentEmail });
    if (!student) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found with the provided email' 
      });
    }

    // Check if the student is already in the classroom
    const alreadyJoined = classData.students.some(s => s.studentId === student._id.toString());
    if (alreadyJoined) {
      return res.status(400).json({ 
        success: false,
        error: 'Student is already in the classroom' 
      });
    }

    // Add the student to the classroom
    classData.students.push({
      studentId: student._id.toString(),
      name: student.name || studentEmail.split('@')[0] || 'Unknown',
      email: studentEmail,
      rollNumber: student.rollNumber || '',
      batch: student.batch || '',
      major: student.major || '',
      joinedAt: new Date()
    });
    await classData.save();

    res.status(200).json({ 
      success: true,
      message: `Student ${student.email} successfully added to class ${classId}`,
      data: { studentId: student._id, classroomId: classId }
    });
  } catch (err) {
    console.error('Error adding student to classroom:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add student: ' + err.message 
    });
  }
});

router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { email } = req.query;
    console.log('GET /student/:studentId - studentId:', studentId, 'email:', email);

    if (!email || email === 'undefined') {
      console.error('Invalid email provided:', email);
      return res.status(400).json({ 
        success: false,
        error: 'Valid email query parameter is required' 
      });
    }

    // Find classes where the student's email is in the students array
    const studentClasses = await Class.find({
      'students.email': email
    }).sort({ createdAt: -1 });

    console.log('Found classes:', studentClasses);
    res.json({ 
      success: true,
      classes: studentClasses 
    });
  } catch (error) {
    console.error('Error fetching student classes:', error.message, error.stack);
    res.status(500).json({ 
      success: false,
      error: `Failed to fetch student classes: ${error.message}`
    });
  }
});


// Bulk add students to a class
router.post('/:classId/people/bulk/staff/:staffId', async (req, res) => {
  try {
    const { classId, staffId } = req.params;
    const { studentEmails } = req.body;

    // Validate input
    if (!studentEmails || !Array.isArray(studentEmails)) {
      return res.status(400).json({ 
        success: false,
        error: 'Student emails array is required' 
      });
    }

    // Remove duplicates from studentEmails array
    const uniqueEmails = [...new Set(studentEmails.map(email => email?.toLowerCase()))].filter(email => email);

    // Check if the classroom exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ 
        success: false,
        error: 'Class not found' 
      });
    }

    // Verify if the staffId is part of the class
    const isAuthorized = classData.staffId === staffId || classData.staff.some(s => s.staffId === staffId);
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: Staff member does not have access to this class' 
      });
    }

    const addedStudents = [];
    const skippedEmails = [];

    // Process each unique email
    for (const email of uniqueEmails) {
      try {
        // Validate email format
        if (!email || !email.endsWith('@gmail.com')) {
          skippedEmails.push(email);
          continue;
        }

        // Find the student by email
        const student = await Student.findOne({ email });
        if (!student) {
          skippedEmails.push(email);
          continue;
        }

        // Check if the student is already in the classroom by studentId or email
        const alreadyJoined = classData.students.some(s => 
          s.studentId === student._id.toString() || s.email.toLowerCase() === email.toLowerCase()
        );
        if (alreadyJoined) {
          skippedEmails.push(email);
          continue;
        }

        // Add the student to the classroom
        classData.students.push({
          studentId: student._id.toString(),
          name: student.name || email.split('@')[0] || 'Unknown',
          email,
          rollNumber: student.rollNumber || '',
          batch: student.batch || '',
          major: student.major || '',
          joinedAt: new Date()
        });

        addedStudents.push({
          studentId: student._id.toString(),
          email,
          name: student.name || email.split('@')[0] || 'Unknown'
        });
      } catch (error) {
        console.error(`Error processing email ${email}:`, error.message);
        skippedEmails.push(email);
      }
    }

    // Save the updated class data
    await classData.save();

    res.status(200).json({ 
      success: true,
      addedStudents,
      skippedEmails,
      message: `${addedStudents.length} student${addedStudents.length === 1 ? '' : 's'} added successfully`
    });
  } catch (error) {
    console.error('Error in bulk student addition:', error.message, error.stack);
    res.status(500).json({ 
      success: false,
      error: `Failed to add students: ${error.message}`
    });
  }
});


module.exports = router;