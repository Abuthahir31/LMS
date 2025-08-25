const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const classRoutes = require('./routes/classRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const unitRoutes = require('./routes/unitRoutes');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');
const apiRoutes = require('./routes/staffRoutes');
const studentRoutes = require('./routes/studentRoutes');
const admin = require('firebase-admin');
const messageRoutes = require('./routes/messages');
const studLogin = require('./routes/activityRoutes');
require('dotenv').config();

console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Defined' : 'Undefined');

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
};

if (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
  console.error('Missing Firebase configuration variables');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

const app = express();
const port = process.env.PORT || 5000;

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, 
//   {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }
)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/classes', classRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api', apiRoutes);
app.use('/api/students', studentRoutes);
app.use('/api', messageRoutes);
app.use('/api/activity', studLogin);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});