import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import StuNavbar from "./StuNavbar";
import Sidebar from "./Sidebar";
import "./home.css";
import { auth } from "./firebase";

function StudentHome() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [studentId, setStudentId] = useState(null);
  const [studentEmail, setStudentEmail] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setStudentId(user.uid);
        setStudentEmail(user.email || null);
        if (user.email) {
          fetchStudentClasses(user.uid, user.email);
        } else {
          setEmailError('Please update your email in your profile to view classes.');
          setClasses([]);
          setLoadingClasses(false);
        }
      } else {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (studentId && studentEmail) {
      const interval = setInterval(() => {
        fetchStudentClasses(studentId, studentEmail);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [studentId, studentEmail]);

  useEffect(() => {
    if (classes.length > 0) {
      fetchAnnouncements(classes);
    } else {
      setAnnouncements([]);
      setLoadingAnnouncements(false);
    }
  }, [classes]);

  const fetchStudentClasses = async (uid, email) => {
    setLoadingClasses(true);
    try {
      if (!email) {
        throw new Error('User email not found');
      }
      const response = await fetch(`https://uelms.onrender.com/api/classes/student/${uid}?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${data.error || 'Unknown error'}`);
      }
      setClasses(Array.isArray(data.classes) ? data.classes : []);
      setEmailError(null);
    } catch (error) {
      console.error('Error fetching classes:', error.message);
      setClasses([]);
      setEmailError('Failed to load classes. Please ensure your email is set in your profile.');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchAnnouncements = async (studentClasses) => {
    setLoadingAnnouncements(true);
    try {
      const classIds = studentClasses.map(cls => cls._id).join(',');
      const response = await fetch(`https://uelms.onrender.com/api/announcements?role=student&classIds=${encodeURIComponent(classIds)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAnnouncements(Array.isArray(data.announcements) ? data.announcements : []);
    } catch (error) {
      console.error('Error fetching announcements:', error.message);
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
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

  const handleClassClick = (cls) => {
    if (!cls._id) {
      console.error('Invalid class ID:', cls);
      return;
    }
    passClassData(cls);
    navigate(`/stream/${cls._id}`);
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
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

  useEffect(() => {
    if (!document.getElementById("material-symbols-font")) {
      const link = document.createElement("link");
      link.id = "material-symbols-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="home-page">
      <StuNavbar
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="main">
        <Sidebar isOpen={sidebarOpen} userRole="student" />
        <div className={`content ${sidebarOpen ? "" : "full-width"}`}>
          {emailError && (
            <div className="error-banner">
              {emailError}
              <button onClick={() => setEmailError(null)} className="close-error">
                ×
              </button>
            </div>
          )}
          <div className="section-header">
            <h2>Your Classes</h2>
          </div>
          {loadingClasses ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading classes...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="no-classes-message">
              <p>No classes available.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {classes.map((cls) => (
                <div className="course-card" key={cls._id}>
                  <div 
                    className="card-clickable" 
                    onClick={() => handleClassClick(cls)}
                  >
                    <div className={`card-header ${cls.color || 'blue'}`}>
                      <div className="card-title">
                        {cls.name} {cls.section && `- ${cls.section}`}
                      </div>
                      <div className="card-teacher">
                        Staff: {cls.teacher || 'Unknown Teacher'}
                      </div>
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
                        to={`/stream/${cls._id}`} 
                        className="action-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          passClassData(cls);
                        }}
                        title="Assignments"
                      >
                        <span className="material-symbols-outlined">assignment</span>
                      </Link>
                      <Link 
                        to={`/assessment/${cls._id}`} 
                        className="action-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          passClassData(cls);
                        }}
                        title="Files"
                      >
                        <span className="material-symbols-outlined">folder</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="section-header">
            <h2>Recent Announcements</h2>
          </div>
          {loadingAnnouncements ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="no-announcements-message">
              <p>No announcements found for your classes</p>
            </div>
          ) : (
            <div className="announcements">
              {announcements.map((a) => (
                <div className="announcement" key={a._id}>
                  <div
                    className="announcement-avatar"
                    style={{ background: a.avatarBg || "#1a73e8" }}
                  >
                    {getInitials(a.postedBy || "A")}
                  </div>
                  <div className="announcement-content">
                    <div className="announcement-header">
                      <div className="announcement-title">
                        <span className="highlight">{a.postedBy || 'No Title'}</span>
                        <span className="highlight announcement-class">
                          Class: {a.className || 'No Class'}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

export default StudentHome;