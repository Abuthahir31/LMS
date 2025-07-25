import React, { useState, useRef, useEffect } from "react";
import "../Navbar.css";
import { auth } from "../firebase";
import { signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaLock, FaUser } from 'react-icons/fa';

const Navbar = ({ toggleSidebar, refreshClasses, refreshAnnouncements }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementLink, setAnnouncementLink] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classes, setClasses] = useState([]);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef();
  const profileDropdownRef = useRef();
  const createModalRef = useRef();
  const announcementModalRef = useRef();
  const resetPasswordModalRef = useRef();
  const navigate = useNavigate();

  const colors = ["red", "orange", "green", "blue", "purple", "teal"];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        const firstLetter = user.email.charAt(0).toUpperCase();
        
        setUserData({
          email: user.email,
          photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${firstLetter}&background=random&color=fff`,
          displayName: displayName,
          shortEmail: user.email.length > 20 
            ? `${user.email.substring(0, 15)}...@${user.email.split('@')[1]}`
            : user.email
        });
        setTeacher(displayName);
      } else {
        setUserData(null);
        setTeacher("");
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch classes for the announcement dropdown, filtered by staffId
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const response = await fetch(`https://lms-iap4.onrender.com/api/classes?staffId=${user.uid}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (response.ok) {
          setClasses(data.classes || []);
        } else {
          console.error('Failed to fetch classes:', data.error);
          setError(data.error || 'Failed to fetch classes');
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Error fetching classes');
      }
    };

    fetchClasses();
  }, [userData]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen((v) => !v);
  };

  const toggleProfileDropdown = (e) => {
    e.stopPropagation();
    setProfileDropdownOpen((v) => !v);
  };

  const openCreateModal = () => {
    setCreateModal(true);
    setError("");
    setTeacher(userData?.displayName || userData?.email.split('@')[0] || "");
  };

  const openAnnouncementModal = () => {
    setAnnouncementModal(true);
    setError("");
    setSelectedClassId("");
  };

  const openResetPasswordModal = () => {
    setResetPasswordModal(true);
    setError("");
    setSuccess("");
    setEmail("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const openInstantMeet = () => {
    alert("Instant Meet feature will be implemented soon!");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to logout. Please try again.");
    }
  };

  const closeModal = (setter) => {
    setter(false);
    setError("");
    setSuccess("");
  };

  const handleCreateClass = async () => {
    if (!className.trim()) {
      setError("Class name is required");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const response = await fetch('https://lms-iap4.onrender.com/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: className,
          section,
          subject,
          teacher: teacher || userData?.displayName || userData?.email.split('@')[0],
          staffId: user.uid,
          email: userData?.email,
          color: colors[Math.floor(Math.random() * colors.length)],
          initials: className.substring(0, 2).toUpperCase()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create class');
      }

      if (refreshClasses && typeof refreshClasses === 'function') {
        refreshClasses();
      }
      setCreateModal(false);
      setClassName("");
      setSection("");
      setSubject("");
      setTeacher(userData?.displayName || userData?.email.split('@')[0] || "");
    } catch (error) {
      console.error('Error creating class:', error);
      setError(error.message || 'Error creating class');
    }
  };

  const handleAddAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim() || !selectedClassId) {
      setError("Title, content, and class selection are required");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const response = await fetch('https://lms-iap4.onrender.com/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: announcementTitle,
          text: announcementContent,
          link: announcementLink,
          avatar: user.displayName || "ME",
          avatarBg: "#34a853",
          classId: selectedClassId,
          postedBy: userData?.displayName || userData?.email.split('@')[0]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create announcement');
      }

      // Only call refreshAnnouncements if it's provided and is a function
      if (refreshAnnouncements && typeof refreshAnnouncements === 'function') {
        refreshAnnouncements();
      }
      
      setAnnouncementModal(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementLink("");
      setSelectedClassId("");
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError(error.message || 'Error creating announcement');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!email.endsWith('@gmail.com')) {
      setError('Please use a valid Gmail address');
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

      if (!user.emailVerified) {
        await signOut(auth);
        setError('Please verify your email address first.');
        setLoading(false);
        return;
      }

      await updatePassword(user, newPassword);
      await signOut(auth);
      setSuccess('Password reset successfully! Please sign in with your new password.');
      setEmail('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setResetPasswordModal(false);
        navigate('/login');
      }, 2000);
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect current password');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak (min 6 chars)');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials provided');
      } else if (err.code === 'auth/invalid-api-key') {
        setError('Invalid API key. Please check your Firebase configuration.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown") && dropdownOpen) {
        setDropdownOpen(false);
      }
      if (!e.target.closest(".profile-dropdown") && profileDropdownOpen) {
        setProfileDropdownOpen(false);
      }
      if (createModal && createModalRef.current && e.target === createModalRef.current) {
        setCreateModal(false);
      }
      if (announcementModal && announcementModalRef.current && e.target === announcementModalRef.current) {
        setAnnouncementModal(false);
      }
      if (resetPasswordModal && resetPasswordModalRef.current && e.target === resetPasswordModalRef.current) {
        setResetPasswordModal(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen, profileDropdownOpen, createModal, announcementModal, resetPasswordModal]);

  return (
    <>
      <div className="navbar-container">
        <nav>
          <div className="nav-left">
            <a href="#" onClick={toggleSidebar} aria-label="Toggle Sidebar">
              <span className="material-symbols-outlined">menu</span>
            </a>
            <span>
              <img className="logo" src="/logo1.jpg" alt="Logo" />
            </span>
          </div>
          <div className="nav-center">
            <h1>LEARNING MANAGEMENT SYSTEM</h1>
          </div>
          <div className="nav-right">
            <div className={`dropdown${dropdownOpen ? " show" : ""}`} ref={dropdownRef}>
              <div className="plus-btn" onClick={toggleDropdown} aria-label="Open Actions Menu">
                <span className="material-symbols-outlined">add</span>
              </div>
              <div className="dropdown-content">
                <a href="#" onClick={(e) => { 
                  e.preventDefault(); 
                  setDropdownOpen(false);
                  openCreateModal();
                }}>
                  <span className="material-symbols-outlined">add</span>
                  Create class
                </a>
                <a href="#" onClick={(e) => { 
                  e.preventDefault(); 
                  setDropdownOpen(false);
                  openAnnouncementModal();
                }}>
                  <span className="material-symbols-outlined">add_comment</span>
                  Add announcement
                </a>
                <a href="#" onClick={(e) => { 
                  e.preventDefault(); 
                  setDropdownOpen(false);
                  openInstantMeet();
                }}>
                  <span className="material-symbols-outlined">videocam</span>
                  Instant Meet
                </a>
              </div>
            </div>
            
            <div className={`profile-dropdown${profileDropdownOpen ? " show" : ""}`} ref={profileDropdownRef}>
              <div className="profile-btn" onClick={toggleProfileDropdown} aria-label="Open Profile Menu">
                {userData && (
                  <img 
                    src={userData.photoURL} 
                    alt="Profile" 
                    className="profile-pic"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${userData.email.charAt(0)}&background=random&color=fff`;
                    }}
                  />
                )}
              </div>
              <div className="profile-dropdown-content">
                {userData && (
                  <>
                    <div className="profile-info">
                      <span className="profile-name">{userData.displayName}</span>
                      <span className="profile-email" title={userData.email}>{userData.email}</span>
                    </div>
                    <div className="dropdown-divider"></div>
                    <a href="#" onClick={(e) => {
                      e.preventDefault();
                      setProfileDropdownOpen(false);
                      openResetPasswordModal();
                    }}>
                      <span className="material-symbols-outlined">lock_reset</span>
                      Reset Password
                    </a>
                    <a href="#" onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}>
                      <span className="material-symbols-outlined">logout</span>
                      Logout
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Create Class Modal */}
      {createModal && (
        <div className="modal show" ref={createModalRef}>
          <div className="modal-content">
            <span className="close" onClick={() => closeModal(setCreateModal)} aria-label="Close Modal">
              ×
            </span>
            <div className="modal-header">
              <h2>Create class</h2>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>Class name (required)</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Section</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Teacher Name</label>
                <p>{userData?.displayName || userData?.email.split('@')[0] || 'N/A'}</p>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancel"
                onClick={() => closeModal(setCreateModal)}
              >
                Cancel
              </button>
              <button
                className="btn btn-create"
                onClick={handleCreateClass}
                disabled={!className.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {announcementModal && (
        <div className="modal show" ref={announcementModalRef}>
          <div className="modal-content">
            <span className="close" onClick={() => closeModal(setAnnouncementModal)} aria-label="Close Modal">
              ×
            </span>
            <div className="modal-header">
              <h2>Add announcement</h2>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>Teacher Name</label>
                <p>{userData?.displayName || userData?.email.split('@')[0] || 'N/A'}</p>
              </div>
              <div className="form-group">
                <label>Class Name (required)</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  required
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} {cls.section ? `- ${cls.section}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Title (required)</label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Content (required)</label>
                <textarea
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Link (optional)</label>
                <input
                  type="url"
                  value={announcementLink}
                  onChange={(e) => setAnnouncementLink(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancel"
                onClick={() => closeModal(setAnnouncementModal)}
              >
                Cancel
              </button>
              <button
                className="btn btn-create"
                onClick={handleAddAnnouncement}
                disabled={!announcementTitle.trim() || !announcementContent.trim() || !selectedClassId}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div className="modal show" ref={resetPasswordModalRef}>
          <div className="modal-content">
            <span className="close" onClick={() => closeModal(setResetPasswordModal)} aria-label="Close Modal">
              ×
            </span>
            <div className="modal-header">
              <h2>Reset Password</h2>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <div className="form-group">
                <label>Your Gmail Address (required)</label>
                <div className="input-with-icon">
                  <FaUser className="input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your Gmail address"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Current Password (required)</label>
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>New Password (required, min 6 chars)</label>
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Confirm New Password (required)</label>
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancel"
                onClick={() => closeModal(setResetPasswordModal)}
              >
                Cancel
              </button>
              <button
                className="btn btn-create"
                onClick={handleResetPassword}
                disabled={loading || !email.trim() || !currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;