const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const Staff = require('../models/Staff');
const Student = require('../models/Students');
const Classroom = require('../models/Class');
// Add staff
router.post('/staff', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const staff = new Staff({ email: email.toLowerCase() });
    await staff.save();
    res.status(201).json({ message: 'Staff email added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get staff
router.get('/staff', async (req, res) => {
  try {
    const staff = await Staff.find();
    res.status(200).json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users from Firebase
router.get('/users', async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users.map(user => ({ email: user.email }));
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user (staff or student)
router.delete('/users', async (req, res) => {
  try {
    const { email, type } = req.body;
    console.log('Request received:', { email, type });

    if (!email || !type) {
      return res.status(400).json({ error: 'Email and type (staff/student) are required' });
    }

    if (type !== 'staff' && type !== 'student') {
      return res.status(400).json({ error: 'Type must be either "staff" or "student"' });
    }

    // Get Firebase user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log('Firebase user found:', user.uid);

    // Delete from Firebase
    await admin.auth().deleteUser(user.uid);
    console.log('User deleted from Firebase:', user.uid);

    // Delete from MongoDB based on type
    if (type === 'staff') {
      const result = await Staff.deleteOne({ email: email.toLowerCase() });
      console.log('Staff deletion result:', result);
    } else if (type === 'student') {
      console.log('Attempting to delete student from MongoDB:', email.toLowerCase());
      const result = await Student.deleteOne({ email: email.toLowerCase() });
      console.log('Student deletion result:', result);
    }

    res.status(200).json({ message: `User ${email} deleted successfully` });
  } catch (err) {
    console.error('Error occurred:', err);
    if (err.code === 'auth/user-not-found') {
      res.status(404).json({ error: 'User not found in Firebase' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Bulk user creation (staff or student)
router.post('/bulk-users', async (req, res) => {
  try {
    const type = req.query.type; 
    const users = req.body.users;

    if (!type || !['staff', 'student'].includes(type)) {
      return res.status(400).json({ error: 'Invalid or missing type (staff|student).' });
    }
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'No users provided' });
    }

    const results = [];
    for (const { email, password } of users) {
      if (
        !email ||
        !password ||
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email.endsWith('@gmail.com') ||
        password.length < 6
      ) {
        results.push({ email, success: false, error: 'Invalid email or password' });
        continue;
      }

      let lowerEmail = email.toLowerCase();

      // Try Firebase creation
      try {
        // Check if exists first (avoids error spam)
        let userRecord;
        try {
          userRecord = await admin.auth().getUserByEmail(lowerEmail);
          results.push({ email: lowerEmail, success: false, error: 'Email already exists in Firebase' });
          continue;
        } catch (err) {
          if (err.code !== 'auth/user-not-found') throw err;
        }

        // Create in Firebase
        await admin.auth().createUser({ email: lowerEmail, password });

        // Add to MongoDB
        if (type === 'staff') {
          await Staff.updateOne({ email: lowerEmail }, { email: lowerEmail }, { upsert: true });
        } else {
          await Student.updateOne({ email: lowerEmail }, { email: lowerEmail }, { upsert: true });
        }

        results.push({ email: lowerEmail, success: true });
      } catch (err) {
        results.push({ email: lowerEmail, success: false, error: err.message });
      }
    }

    res.status(200).json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;