import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import StaffSidebar from "./staffsidebar";
import "../home.css";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from 'axios';

function StaffHome() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [staffEmails, setStaffEmails] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        
        if (!currentUser) {
          navigate("/login");
          return;
        }

        await Promise.all([
          fetchStaffEmails(),
          fetchClasses(currentUser.uid),
          fetchAnnouncements(currentUser.uid),
        ]);
      } catch (err) {
        setError(err.message);
        console.error("Auth state error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchStaffEmails = async () => {
    try {
      const response = await axios.get('https://lms-iap4.onrender.com/api/staff');
      setStaffEmails(response.data.map(staff => staff.email.toLowerCase()));
    } catch (error) {
      console.error('Error fetching staff emails:', error);
      setError(error.response?.data?.error || error.message);
      setStaffEmails([]);
    }
  };

  const fetchClasses = async (userId) => {
    try {
      if (!userId) throw new Error('User not authenticated');
      const response = await axios.get(`https://lms-iap4.onrender.com/api/classes?staffId=${userId}`);
      const staffClasses = response.data.classes.filter(cls => cls.staffId === userId);
      setClasses(staffClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError(error.response?.data?.error || error.message);
      setClasses([]);
    }
  };

  const fetchAnnouncements = async (userId) => {
    try {
      if (!userId) throw new Error('User not authenticated');
      const classResponse = await axios.get(`https://lms-iap4.onrender.com/api/classes?staffId=${userId}`);
      const classIds = classResponse.data.classes.map(cls => cls._id).join(',');

      const currentUser = auth.currentUser;
      const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0];

      const response = await axios.get(`https://lms-iap4.onrender.com/api/announcements`, {
        params: {
          classIds: classIds || '',
          role: 'staff',
          postedBy: userDisplayName,
        }
      });

      const announcementsData = Array.isArray(response.data.announcements) 
        ? response.data.announcements 
        : [];
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      const errorMessage = error.response?.data?.error || error.message;
      setError(`Failed to fetch announcements: ${errorMessage}`);
      setAnnouncements([]);
    }
  };

  const handleDeleteAnnouncement = async (announcementId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await axios.delete(`https://lms-iap4.onrender.com/api/announcements/${announcementId}`);
      setAnnouncements(prev => prev.filter(a => a._id !== announcementId));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError(error.response?.data?.error || error.message);
    }
  };

  const passClassData = (classObj) => {
    localStorage.setItem(
      "currentClass",
      JSON.stringify({
        id: classObj._id,
        name: classObj.name,
        section: classObj.section,
        teacher: classObj.teacher,
        color: classObj.color,
      })
    );
  };

  const handleShareClass = async (classId, e) => {
    e.stopPropagation();
    
    try {
      await axios.get(`https://lms-iap4.onrender.com/api/classes/${classId}/verify`);
      if (navigator.share) {
        await navigator.share({
          title: 'Join my class',
          text: `Use this class ID to join: ${classId}`,
        });
      } else {
        await navigator.clipboard.writeText(classId);
        alert('Class ID copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing class:', error);
      if (error.name !== 'AbortError') {
        setError(error.response?.data?.error || `Failed to share class: ${error.message}`);
      }
    }
  };

  const handleDeleteClass = async (classId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`https://lms-iap4.onrender.com/api/classes/${classId}`);
      setClasses(prev => prev.filter(c => c._id !== classId));
      await fetchAnnouncements(user.uid);
    } catch (error) {
      console.error('Error deleting class:', error);
      setError(error.response?.data?.error || error.message);
    }
  };

  const handleClassClick = (cls) => {
    passClassData(cls);
    navigate(`/staffstream/${cls._id}`);
  };

  useEffect(() => {
    if (!document.getElementById("material-symbols-font")) {
      const link = document.createElement("link");
      link.id = "material-symbols-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0";
      document.head.appendChild(link);
    }
  }, []);

  const getInitials = (name = "") => {
    return name.split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getLinkText = (url) => {
    if (!url) return "";
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      if (hostname.includes("meet.google.com")) return "Join Meet";
      if (hostname.includes("forms.google.com") || hostname.includes("docs.google.com/forms"))
        return "Open Form";
      if (hostname.includes("drive.google.com")) return "View Drive";
      if (hostname.includes("docs.google.com")) return "Open Doc";
      if (hostname.includes("classroom.google.com")) return "View Classroom";
      return "Open Link";
    } catch {
      return "Open Link";
    }
  };

  const isUserAnnouncement = (announcement) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    
    const userDisplayName = currentUser.displayName || currentUser.email?.split('@')[0];
    return announcement.postedBy === userDisplayName;
  };

  const formatDate = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    const diffTime = today - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString();
  };

  const refreshData = () => {
    if (user) {
      Promise.all([
        fetchClasses(user.uid),
        fetchAnnouncements(user.uid)
      ]).catch(err => {
        console.error("Error refreshing data:", err);
        setError(err.message);
      });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Navbar 
        toggleSidebar={toggleSidebar} 
        refreshClasses={() => user && fetchClasses(user.uid)}
        refreshAnnouncements={() => user && fetchAnnouncements(user.uid)}
        userRole="staff"
      />
      
      <div className="main">
        <StaffSidebar isOpen={sidebarOpen} userRole="staff" />
        
        <div className={`content ${sidebarOpen ? "" : "full-width"}`}>
          {error && (
            <div className="error-banner">
              {error}
              <button onClick={() => setError(null)} className="close-error">
                ×
              </button>
            </div>
          )}

          <div className="section-header">
            <h2>Classes</h2>
            <div className="header-actions">
            </div>
          </div>

          <div className="cards-grid">
            {classes.length > 0 ? (
              classes.map((cls) => (
                <div className="course-card" key={cls._id}>
                  <div 
                    className="card-clickable" 
                    onClick={() => handleClassClick(cls)}
                  >
                    <div className={`card-header ${cls.color || 'blue'}`}>
                      <div className="card-title">{cls.name} {cls.section && `- ${cls.section}`}</div>
                      <div className="card-teacher">Staff: {cls.teacher || 'Not specified'}</div>
                    </div>
                  </div>
                  <div className="card-body">
                    {cls.avatar ? (
                      <img className="card-avatar" src={cls.avatar} alt={cls.name} />
                    ) : (
                      <div
                        className="card-avatar"
                        style={{ background: cls.avatarBg || "#1a73e8" }}
                      >
                        {getInitials(cls.name)}
                      </div>
                    )}
                    <div className="card-actions">
                      <Link 
                        to={`/staffstream/${cls._id}`} 
                        className="action-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          passClassData(cls);
                        }}
                        title="Assignments"
                      >
                        <span className="material-symbols-outlined">assignment_ind</span>
                      </Link>
                      <Link 
                        to="/staffassessment" 
                        className="action-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          passClassData(cls);
                        }}
                        title="Files"
                      >
                        <span className="material-symbols-outlined">folder</span>
                      </Link>
                      <button 
                        className="action-icon share-btn"
                        onClick={(e) => handleShareClass(cls._id, e)}
                        title="Share Class"
                      >
                        <span className="material-symbols-outlined">share</span>
                      </button>
                      <button 
                        className="action-icon delete-btn"
                        onClick={(e) => handleDeleteClass(cls._id, e)}
                        title="Delete Class"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-classes-message">
                <p>No classes found. Create your first class!</p>
              </div>
            )}
          </div>

          <div className="section-header">
            <h2>My Announcements</h2>
            <div className="header-actions">
            </div>
          </div>

          <div className="announcements">
            {announcements.length > 0 ? (
              announcements.map((a) => (
                <div className="announcement" key={a._id} style={{ position: 'relative' }}>
                  <div
                    className="announcement-avatar"
                    style={{ background: a.avatarBg || "#1a73e8" }}
                  >
                    {getInitials(a.postedBy || "A")}
                  </div>
                  <div className="announcement-content">
                    <div className="announcement-header">
                      <div className="announcement-title">
                        <span className="highlight">{a.postedBy || 'No title'}</span>
                        <span className="highlight announcement-class">
                          Class: {a.className}
                        </span>
                      </div>
                      <div className="announcement-date">
                        <span className="date-badge">{formatDate(a.createdAt)}</span>
                      </div>
                    </div>
                    <div className="announcement-text">{a.text || 'No content'}</div>
                    {a.link && (
                      <a
                        href={a.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="announcement-link"
                      >
                        <span className="material-symbols-outlined">link</span>
                        {getLinkText(a.link)}
                      </a>
                    )}
                    <div className="announcement-meta">
                      {a.title}
                    </div>
                    {isUserAnnouncement(a) && (
                      <button 
                        className="announcement-delete-btn"
                        onClick={(e) => handleDeleteAnnouncement(a._id, e)}
                        title="Delete Announcement"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-announcements-message">
                <p>No announcements found. Create your first announcement!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffHome;