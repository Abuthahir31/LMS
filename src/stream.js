import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStream, faClipboardList, faUsers, faComments,
  faUser, faExclamationTriangle, faSpinner,
  faVideo, faClock, faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import StuNavbar from './StuNavbar';
import Sidebar from './Sidebar';
import './stream.css';
import axios from 'axios';
import { auth } from './firebase';

const BASE_URL = 'https://uelms.onrender.com';

const StreamPage = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classData, setClassData] = useState({
    name: 'Loading...',
    section: '',
    teacher: '',
    color: 'orange',
    id: classId
  });
  const [loadingClass, setLoadingClass] = useState(true);
  const [errorClass, setErrorClass] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [studentEmail, setStudentEmail] = useState(null);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setStudentId(user.uid);
        setStudentEmail(user.email || null);
        if (user.email) {
          fetchClassData(user.uid, user.email);
          fetchMeetings(user.uid);
        } else {
          setErrorClass('No email found. Please update your email in your profile.');
          setLoadingClass(false);
        }
      } else {
        setErrorClass('User not authenticated. Please log in.');
        setLoadingClass(false);
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate, classId]);

  useEffect(() => {
    if (!document.getElementById("material-symbols-font")) {
      const link = document.createElement("link");
      link.id = "material-symbols-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0";
      document.head.appendChild(link);
    }
  }, []);

  const fetchClassData = async (studentId, email) => {
    if (!studentId || !classId || !email) {
      setErrorClass('Invalid student, class, or email information.');
      setLoadingClass(false);
      return;
    }

    try {
      setLoadingClass(true);
      setErrorClass(null);

      const response = await axios.get(`${BASE_URL}/api/classes/student/${studentId}?email=${encodeURIComponent(email)}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch classes');
      }

      const studentClasses = response.data.classes || [];
      const targetClass = studentClasses.find(cls => cls._id === classId);

      if (!targetClass) {
        throw new Error('Class not found or you are not enrolled in this class.');
      }

      setClassData({
        name: targetClass.name,
        section: targetClass.section || '',
        teacher: targetClass.teacher || 'Unknown Teacher',
        color: targetClass.color || 'orange',
        id: classId
      });
    } catch (err) {
      setErrorClass(err.message || 'Failed to load class information. Please try again.');
    } finally {
      setLoadingClass(false);
    }
  };

  const fetchMeetings = async (studentId) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/assignments/${classId}/student/${studentId}`);
      const meetingData = response.data.filter(item => item.type.includes('meet'));
      setMeetings(meetingData);
    } catch (err) {
      console.error('Failed to fetch meetings:', err.response?.data || err.message);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const getClassBackground = () => {
    const colors = {
      blue: 'linear-gradient(135deg, #4967dc, #050505)',
      orange: 'linear-gradient(135deg, #ff8c00, #050505)',
      red: 'linear-gradient(135deg, #dc3545, #050505)',
      green: 'linear-gradient(135deg, #28a745, #050505)',
      purple: 'linear-gradient(135deg, #6f42c1, #050505)'
    };
    return colors[classData.color] || colors.orange;
  };

  const joinMeet = (meetLink, meetType) => {
    if (!meetLink) {
      if (meetType === 'meet-google') {
        window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');
      } else if (meetType === 'meet-zoom') {
        alert('No Zoom meeting link provided. Please contact your instructor for the meeting link.');
      } else if (meetType === 'meet-teams') {
        alert('No Microsoft Teams meeting link provided. Please contact your instructor for the meeting link.');
      }
    } else {
      const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
      if (!urlRegex.test(meetLink)) {
        alert('Invalid meeting link. Please contact your instructor for a valid link.');
        return;
      }
      if (meetType === 'meet-zoom' && !meetLink.includes('zoom.us')) {
        alert('Invalid Zoom meeting link. Please contact your instructor for a valid Zoom link.');
        return;
      }
      if (meetType === 'meet-teams' && !meetLink.includes('teams.microsoft.com')) {
        alert('Invalid Microsoft Teams meeting link. Please contact your instructor for a valid Teams link.');
        return;
      }
      window.open(meetLink, '_blank', 'noopener,noreferrer');
    }
  };

  const renderMeetings = () => {
    if (meetings.length === 0) {
      return (
        <div className="no-assignments">
          <FontAwesomeIcon icon={faVideo} size="3x" />
          <h3>No meetings scheduled</h3>
          <p>Check back later for meeting announcements.</p>
        </div>
      );
    }

    return meetings.map(meeting => (
      <div key={meeting._id || meeting.id} className="assignment-card meet-card">
        <div className="assignment-card-inner">
          <div className="assignment-header">
            <div className="assignment-type">
              {meeting.type === 'meet-google' && <FontAwesomeIcon icon={faVideo} />}
              {meeting.type === 'meet-zoom' && <FontAwesomeIcon icon={faVideo} />}
              {meeting.type === 'meet-teams' && <FontAwesomeIcon icon={faVideo} />}
              {meeting.type === 'meet-google' && <span>Google Meet</span>}
              {meeting.type === 'meet-zoom' && <span>Zoom Meeting</span>}
              {meeting.type === 'meet-teams' && <span>Microsoft Teams</span>}
            </div>
            <div className="assignment-date">{new Date(meeting.createdAt).toLocaleString()}</div>
          </div>

          <div className="assignment-content">
            <div className="assignment-title">{meeting.title}</div>
            {meeting.meetTime && (
              <div className="assignment-time">
                <FontAwesomeIcon icon={faClock} />
                <span>{meeting.meetTime}</span>
              </div>
            )}
            {meeting.description && (
              <div className="assignment-description">{meeting.description}</div>
            )}
          </div>

          <div className="meet-actions">
            <button
              className="join-meet-btn"
              onClick={() => joinMeet(meeting.meetLink, meeting.type)}
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} /> Join {meeting.type === 'meet-google' ? 'Google Meet' : meeting.type === 'meet-zoom' ? 'Zoom' : 'Teams'}
            </button>
          </div>
        </div>
      </div>
    ));
  };

  const renderContent = () => {
    if (loadingClass) {
      return (
        <div className="loading-assignments">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Loading class information...</p>
        </div>
      );
    }

    if (errorClass) {
      return (
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
          <h3>Class Not Found</h3>
          <p>{errorClass}</p>
          <button className="retry-btn" onClick={() => navigate('/home')}>
            Go to Home
          </button>
        </div>
      );
    }

    return (
      <div className="content-wrapper">
        <div className="stream-header" style={{ background: getClassBackground() }}>
          <h1>{classData.name} - {classData.section}</h1>
          <div className="class-teacher">
            <FontAwesomeIcon icon={faUser} /> {classData.teacher}
          </div>
        </div>
        <div className="assignments-container">
          <div className="assignments-list">
            {renderMeetings()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="stream-page">
      <StuNavbar toggleSidebar={toggleSidebar} />
      <div className="main">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`content ${sidebarOpen ? "" : "full-width"}`}>
          {renderContent()}
        </div>
      </div>
      <div className={`bottom-nav-fixed ${sidebarOpen ? "with-sidebar" : ""}`}>
        <Link to={`/stream/${classId}`} className="nav-item active">
          <FontAwesomeIcon icon={faStream} />
          <span>Stream</span>
        </Link>
        <Link to={`/assignments/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faClipboardList} />
          <span>Assignments</span>
        </Link>
        <Link to={`/assessment/${classId}`} className="nav-item">
                  <FontAwesomeIcon icon={faClipboardList} />
                  <span>Learning AID</span>
                </Link>
        <Link to={`/people/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faUsers} />
          <span>People</span>
        </Link>
        <Link to={`/chat/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faComments} />
          <span>Discussion Forum</span>
        </Link>
      </div>
    </div>
  );
};

export default StreamPage;