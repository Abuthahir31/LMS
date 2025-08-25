import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, updatePassword } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaGoogle } from 'react-icons/fa';
import axios from 'axios';

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
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Regular expression for email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const styles = `
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
}
.login-page {
  min-height: 100vh;
  width: 100vw;
  font-family: 'Poppins', sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  margin: 0;
  padding: 0;
  position: relative;
}

.login-background {
  position: fixed;
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  background-image: url('https://ue.ac.zm/wp-content/uploads/2024/06/UE-Building-v2-overlay.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-header {
  position: fixed;
  top: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px 0;
  z-index: 100;
  background: transparent;
  pointer-events: none;
}

.login-header h1 {
  font-size: clamp(1.2rem, 4vw, 2.5rem);
  color: white;
  font-family: monospace;
  white-space: nowrap;
  top: 45px;
  text-align: center;
  margin: 0;
  padding: 50px 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.login-header a {
  position: absolute;
  right: 20px;
  top: 760px;
  color: white;
  text-decoration: none;
  font-size: 1rem;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  transition: all 0.3s ease;
  pointer-events: auto;
}

.login-header a:hover { 
  background: rgba(0,0,0,0.5); 
}

.login-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  margin: 0;
  padding: 80px 0 20px; /* Added padding to account for fixed header */
}

.auth-container, .auth-form-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.auth-form-container {
  max-width: 400px;
  width: 90%;
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  backdrop-filter: blur(10px);
  padding: 40px;
  margin: 20px 0;
  transition: all 0.3s ease;
}

.auth-form-container.slide-in {
  animation: slideIn 0.3s ease-out forwards;
}

@keyframes slideIn {
  from { opacity:0; transform:translateY(40px);}
  to   { opacity:1; transform:translateY(0);}
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.auth-heading {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.auth-input-box {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 15px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.auth-icon {
  color: #6c47ff;
  font-size: 18px;
  margin-right: 15px;
}

.auth-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 8px 0;
  background: transparent;
}

.auth-login-button {
  padding: 16px;
  border: none;
  border-radius: 8px;
  background: #6c47ff;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 15px;
}

.auth-login-button:hover { background: #5a3bd1; }
.auth-login-button:disabled { background: #aaa; cursor: not-allowed;}

.auth-google-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: none;
  border-radius: 8px;
  background: #DB4437;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.auth-google-button:hover { background: #c23321; }
.auth-google-button:disabled { background: #aaa; cursor: not-allowed;}

.auth-toggle-text {
  text-align: center;
  color: #555;
  font-size: 14px;
  margin-top: 20px;
}

.auth-toggle-button {
  background: none;
  border: none;
  color: #6c47ff;
  cursor: pointer;
  font-weight: bold;
  padding: 0;
  font-size: 14px;
  transition: all 0.2s;
}

.auth-toggle-button:hover { text-decoration: underline; color: #5a3bd1; }
.auth-error-text { color: #ff4444; font-size: 14px; text-align: center; margin-bottom: 15px; }
.auth-success-text { color: #00C851; font-size: 14px; text-align: center; margin-bottom: 15px; }

@media (max-width: 768px) {
  .auth-form-container { 
    padding: 30px;
    max-width: 380px;
  }
  .login-header h1 {
    font-size: clamp(1.2rem, 5vw, 2rem);
    white-space: normal;
  }
}

@media (max-width: 480px) {
  .auth-form-container { 
    padding: 20px;
    width: 95%;
  }
  .login-header h1 {
    padding: 10px;
    font-size: clamp(1rem, 5vw, 1.5rem);
  }
  .login-header a {
    font-size: 0.9rem;
    padding: 6px 12px;
    right: 10px;
    top: 10px;
  }
}
`;

function ResetPassword({ setMode }) {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setLoading(false);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match');
      setLoading(false);
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, currentPassword);
      const user = userCredential.user;
      await updatePassword(user, newPassword);
      await signOut(auth);
      setSuccess('Password reset successfully! Please sign in with your new password.');
      setEmail('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setMode('signin');
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect current password');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak (min 6 chars)');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container slide-in">
        <div className="auth-form">
          <h2 className="auth-heading">Reset Password</h2>
          {error && <p className="auth-error-text">{error}</p>}
          {success && <p className="auth-success-text">{success}</p>}

          <div className="auth-input-box">
            <FaUser className="auth-icon" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          <div className="auth-input-box">
            <FaLock className="auth-icon" />
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          <div className="auth-input-box">
            <FaLock className="auth-icon" />
            <input
              type="password"
              placeholder="New Password (min 6 chars)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="auth-input"
              minLength="6"
              required
            />
          </div>
          <div className="auth-input-box">
            <FaLock className="auth-icon" />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          <button onClick={handleResetPassword} className="auth-login-button" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <p className="auth-toggle-text">
            Back to{' '}
            <button
              type="button"
              className="auth-toggle-button"
              onClick={() => setMode('signin')}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function SignIn({ setMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [staffEmails, setStaffEmails] = useState([]);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const staffResponse = await axios.get('http://uelms.onrender.com/api/staff');
        const staffEmails = staffResponse.data.map(staff => staff.email.toLowerCase());
        setStaffEmails(staffEmails);

        const studentResponse = await axios.get('http://uelms.onrender.com/api/students');
        setStudents(studentResponse.data);
      } catch (err) {
        setError('Failed to fetch data. Please ensure the server is running or try again later.');
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoadingEmail(true);
    setError(null);

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoadingEmail(false);
      return;
    }

    if (email.toLowerCase() === 'uelms2025@gmail.com' && password === 'admin123') {
      navigate('/lnnmspsaavs', { replace: true });
      setEmail('');
      setPassword('');
      setLoadingEmail(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = email.toLowerCase();
      const isStaff = staffEmails.includes(userEmail);

      if (isStaff) {
        navigate('/staffhome', { replace: true });
      } else {
        const student = students.find(s => s.email.toLowerCase() === userEmail);
        if (student) {
          navigate(`/home`, {
            state: {
              studentId: student._id,
              studentName: student.name
            }
          });
        } else {
          setError('Student account not found. Please contact admin.');
          await signOut(auth);
        }
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format');
      } else {
        setError(err.message);
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = user.email.toLowerCase();

      if (userEmail === 'uelms2025@gmail.com') {
        navigate('/lnnmspsaavs', { replace: true });
        setEmail('');
        setLoadingGoogle(false);
        return;
      }

      const isStaff = staffEmails.includes(userEmail);

      if (isStaff) {
        navigate('/staffhome', { replace: true });
        return;
      }

      let student = students.find(s => s.email.toLowerCase() === userEmail);

      if (!student) {
        setError('Student account not found. Please contact admin.');
        await signOut(auth);
        return;
      }

      navigate(`/home`, {
        state: {
          studentId: student._id,
          studentName: student.name
        }
      });
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email but different sign-in method. Please use email/password login.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(error.message);
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-form">
          <h2 className="auth-heading">Sign In</h2>
          {error && <p className="auth-error-text">{error}</p>}
          <div className="auth-input-box">
            <FaUser className="auth-icon" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          <div className="auth-input-box">
            <FaLock className="auth-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          <button
            onClick={handleSignIn}
            className="auth-login-button"
            disabled={loadingEmail}
            type="button"
          >
            {loadingEmail ? "Signing In..." : "Sign In"}
          </button>
          {/* <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle}
            className="auth-google-button"
          >
            <FaGoogle style={{ marginRight: '10px' }} />
            {loadingGoogle ? "Signing In..." : "Sign in with Google"}
          </button> */}
          <p className="auth-toggle-text">
            <button
              type="button"
              className="auth-toggle-button"
              onClick={() => setMode('reset')}
            >
              Forgot/Reset Password?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Login() {
  const [mode, setMode] = useState('signin');
  const [user] = useAuthState(auth);
  const [staffEmails, setStaffEmails] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const staffResponse = await axios.get('http://uelms.onrender.com/api/staff');
        const staffEmails = staffResponse.data.map(staff => staff.email.toLowerCase());
        setStaffEmails(staffEmails);

        const studentResponse = await axios.get('http://uelms.onrender.com/api/students');
        setStudents(studentResponse.data);
      } catch (err) {
        setError('Failed to fetch data. Please ensure the server is running or try again later.'); 
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      const userEmail = user.email.toLowerCase();
      const isStaff = staffEmails.includes(userEmail);
      if (isStaff) {
        navigate('/staffhome', { replace: true });
      } else {
        const student = students.find(s => s.email.toLowerCase() === userEmail);
        if (student) {
          navigate(`/home`, {
            state: {
              studentId: student._id,
              studentName: student.name
            }
          });
        } else if (userEmail === "uelms2025@gmail.com") {
          navigate("/lnnmspsaavs", { replace: true });
        } else {
          signOut(auth);
          alert('Account not found. Please contact admin.');
        }
      }
    }
  }, [user, staffEmails, students, navigate]);

  return (
    <div className="login-page">
      <div className="login-background"></div>
      <div className="login-header">
        <img
          src="/edenberg.png"
          alt="Edenberg University Logo"
          style={{
            position: 'absolute',
            left: 'clamp(10px, 2vw, 30px)',
            top: 'clamp(5px, 1.5vw, 15px)',
            maxWidth: 'clamp(60px, 10vw, 150px)',
            height: 'auto',
            pointerEvents: 'auto',
            zIndex: 101,
          }}
        />
        <h1>Learning Management System</h1>
        <a href="https://ue.ac.zm/">Home</a>
      </div>
      <div className="login-content">
        {mode === 'signin' && <SignIn setMode={setMode} />}
        {mode === 'reset' && <ResetPassword setMode={setMode} />}
        {error && <p className="auth-error-text">{error}</p>}
      </div>
    </div>
  );
}

export default Login;