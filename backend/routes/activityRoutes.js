const express = require('express');
const router = express.Router();
const Activity = require('../models/StudentActivity');
const Class = require('../models/Class');
const Student = require('../models/Students');

// Helper function to extract name from email
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

router.post('/log', async (req, res) => {
  const { userId, email, type } = req.body;
  if (!userId || !email || !['login', 'logout', 'password_reset'].includes(type)) {
    console.error('Invalid request data:', { userId, email, type });
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    if (type === 'login') {
      // Check for an active session
      const activeSession = await Activity.findOne({
        userId,
        type: 'login',
        loggedOut: false,
      });

      if (activeSession) {
        console.log(`User ${userId} already logged in at ${activeSession.timestamp}`);
        return res.status(200).json({ message: 'User already logged in' });
      }

      // Create new login record
      const activity = new Activity({
        userId,
        email,
        type,
        loggedOut: false,
      });
      await activity.save();
      console.log(`Login recorded for user ${userId} at ${activity.timestamp}`);
    } else if (type === 'logout') {
      // Retry logic for updating logout time
      let lastLogin;
      let attempts = 0;
      const maxAttempts = 3;

      while (!lastLogin && attempts < maxAttempts) {
        lastLogin = await Activity.findOneAndUpdate(
          {
            userId,
            type: 'login',
            loggedOut: false,
          },
          {
            $set: {
              loggedOut: true,
              logoutTime: new Date(),
            },
          },
          { sort: { timestamp: -1 }, new: true }
        );
        attempts++;
        if (!lastLogin && attempts < maxAttempts) {
          console.warn(`Retry ${attempts} for updating logout time for user ${userId}`);
          await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
        }
      }

      // Create a logout record
      const activity = new Activity({
        userId,
        email,
        type: 'logout',
        relatedLogin: lastLogin ? lastLogin._id : null,
      });
      await activity.save();
      console.log(`Logout recorded for user ${userId} at ${activity.timestamp}${lastLogin ? `, linked to login at ${lastLogin.timestamp}` : ', no active session found'}`);

      return res.status(200).json({
        message: lastLogin ? 'Logout recorded' : 'No active session, logout recorded',
      });
    } else if (type === 'password_reset') {
      // Record password reset activity
      const activity = new Activity({
        userId,
        email,
        type,
      });
      await activity.save();
      console.log(`Password reset recorded for user ${userId} at ${activity.timestamp}`);
    }

    res.status(201).json({ message: 'Activity logged' });
  } catch (err) {
    console.error('Error logging activity:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

router.get('/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    
    // First get all students in the class
    const classData = await Class.findById(classId).select('students');
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const studentEmails = classData.students.map(s => s.email);
    const studentIds = classData.students.map(s => s.studentId);

    // Get student names from database
    const studentsFromDB = await Student.find({ email: { $in: studentEmails } });
    const studentNameMap = {};
    studentsFromDB.forEach(student => {
      studentNameMap[student.email] = student.name;
    });

    // Fetch activities for these students only
    const activities = await Activity.find({
      $or: [
        { email: { $in: studentEmails } },
        { userId: { $in: studentIds } }
      ]
    }).sort({ timestamp: 1 }).exec();

    // Group activities by userId and pair login/logout
    const sessions = [];
    const userStates = {};

    activities.forEach((act) => {
      if (!userStates[act.userId]) {
        userStates[act.userId] = { 
          email: act.email, 
          lastLogin: null,
          name: studentNameMap[act.email] || extractNameFromEmail(act.email)
        };
      }

      if (act.type === 'login') {
        userStates[act.userId].lastLogin = act;
      } else if (act.type === 'logout') {
        const { lastLogin, name } = userStates[act.userId];
        if (lastLogin) {
          sessions.push({
            userId: act.userId,
            email: act.email,
            name: name,
            inTime: lastLogin.timestamp,
            outTime: lastLogin.logoutTime || act.timestamp,
          });
          userStates[act.userId].lastLogin = null;
        } else {
          // Handle logout without a matching login
          sessions.push({
            userId: act.userId,
            email: act.email,
            name: userStates[act.userId].name,
            inTime: null,
            outTime: act.timestamp,
          });
        }
      }
    });

    // Handle active sessions (logins without logouts)
    Object.entries(userStates).forEach(([userId, { email, lastLogin, name }]) => {
      if (lastLogin && !lastLogin.loggedOut) {
        sessions.push({
          userId,
          email,
          name: name,
          inTime: lastLogin.timestamp,
          outTime: null,
        });
      }
    });

    // Sort sessions by inTime (most recent first), handling null inTime
    sessions.sort((a, b) => {
      if (!a.inTime && !b.inTime) return new Date(b.outTime) - new Date(a.outTime);
      if (!a.inTime) return 1;
      if (!b.inTime) return -1;
      return new Date(b.inTime) - new Date(a.inTime);
    });

    res.json(sessions);
  } catch (err) {
    console.error('Error fetching class sessions:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch class sessions' });
  }
});

router.get('/all', async (req, res) => {
  try {
    const activities = await Activity.find().sort({ timestamp: 1 }).exec();

    // Group activities by userId and pair login/logout
    const sessions = [];
    const userStates = {};

    activities.forEach((act) => {
      if (!userStates[act.userId]) {
        userStates[act.userId] = { 
          email: act.email, 
          lastLogin: null,
          name: extractNameFromEmail(act.email)
        };
      }

      if (act.type === 'login') {
        userStates[act.userId].lastLogin = act;
      } else if (act.type === 'logout') {
        const { lastLogin, name } = userStates[act.userId];
        if (lastLogin) {
          sessions.push({
            userId: act.userId,
            email: act.email,
            name: name,
            inTime: lastLogin.timestamp,
            outTime: lastLogin.logoutTime || act.timestamp,
          });
          userStates[act.userId].lastLogin = null;
        } else {
          // Handle logout without a matching login
          sessions.push({
            userId: act.userId,
            email: act.email,
            name: userStates[act.userId].name,
            inTime: null,
            outTime: act.timestamp,
          });
        }
      }
    });

    // Handle active sessions (logins without logouts)
    Object.entries(userStates).forEach(([userId, { email, lastLogin, name }]) => {
      if (lastLogin && !lastLogin.loggedOut) {
        sessions.push({
          userId,
          email,
          name: name,
          inTime: lastLogin.timestamp,
          outTime: null,
        });
      }
    });

    // Sort sessions by inTime (most recent first), handling null inTime
    sessions.sort((a, b) => {
      if (!a.inTime && !b.inTime) return new Date(b.outTime) - new Date(a.outTime);
      if (!a.inTime) return 1;
      if (!b.inTime) return -1;
      return new Date(b.inTime) - new Date(a.inTime);
    });

    res.json(sessions);
  } catch (err) {
    console.error('Error fetching sessions:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

module.exports = router;