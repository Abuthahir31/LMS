import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCcQLbLCItjBCONx8BmXyjOiDuIxbhRUVM",
  authDomain: "uelms-378db.firebaseapp.com",
  projectId: "uelms-378db",
  storageBucket: "uelms-378db.firebasestorage.app",
  messagingSenderId: "1004799765492",
  appId: "1:1004799765492:web:111090f0932afdffcaa7a1",
  measurementId: "G-G6N8HNRCVD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };