import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faVideo, faStream, faClipboardList, faUsers, faPlus, faTimes,
  faExternalLinkAlt, faClock, faLink, faEdit, faTrash, faComments,
  faClock as faTrackLogin
} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import StaffSidebar from './staffsidebar';
import '../stream.css';
import axios from 'axios';
import { auth } from '../firebase';

const BASE_URL = 'https://uelms.onrender.com';

const StaffStream = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classData, setClassData] = useState({
    name: 'Loading...',
    section: '',
    teacher: '',
    color: 'orange',
    id: null
  });
  const [staffId, setStaffId] = useState(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetTime, setMeetTime] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { classId } = useParams();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setStaffId(user.uid);
        const savedClassData = JSON.parse(localStorage.getItem('currentClass'));
        if (classId && savedClassData && savedClassData.id === classId) {
          setClassData({
            ...savedClassData,
            id: classId
          });
          fetchClassDetails(classId, user.uid);
          fetchMeetings(classId, user.uid);
        } else {
          setError('No class selected or invalid class ID. Please select a class from the dashboard.');
          navigate('/staffhome');
        }
      } else {
        setError('User not authenticated. Please log in.');
        navigate('/login');
      }
    });

    if (!document.getElementById("material-symbols-font")) {
      const link = document.createElement("link");
      link.id = "material-symbols-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0";
      document.head.appendChild(link);
    }

    return () => unsubscribe();
  }, [navigate, classId]);

  const fetchClassDetails = async (classId, staffId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/classes/${classId}/staff/${staffId}`);
      setClassData(prev => ({
        ...prev,
        ...response.data.class,
        id: classId
      }));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch class details:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to load class details.');
      navigate('/staffhome');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMeetings = async (classId, staffId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/assignments/${classId}/staff/${staffId}`);
      // Filter only meeting-related items
      const meetingItems = response.data.filter(item => item.type.includes('meet'));
      console.log('Fetched meetings:', meetingItems); // Debug log
      setMeetings(meetingItems);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch meetings:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load meetings.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const createGoogleMeet = () => {
    alert('Opening Google Meet to schedule a new meeting. After scheduling, copy the meeting link and paste it into the Meeting Link field.');
    window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');
  };

  const createZoomMeeting = () => {
    alert('Opening Zoom to schedule a new meeting. After scheduling, copy the meeting link and paste it into the Meeting Link field.');
    window.open('https://zoom.us/meeting/schedule', '_blank', 'noopener,noreferrer');
  };

  const createMicrosoftTeamsMeeting = () => {
    alert('Opening Microsoft Teams to schedule a new meeting. After scheduling, copy the meeting link and paste it into the Meeting Link field.');
    window.open('https://www.microsoft.com/en-us/microsoft-teams/schedule-a-meeting', '_blank', 'noopener,noreferrer');
  };

  const getClassBackground = () => {
    const colors = {
      blue: 'linear-gradient(135deg, #4285f4, #34a853)',
      orange: 'linear-gradient(135deg, #ff6b35, #f7931e)',
      red: 'linear-gradient(135deg, #ea4335, #fbbc05)',
      green: 'linear-gradient(135deg, #34a853, #4285f4)',
      purple: 'linear-gradient(135deg, #9c27b0, #673ab7)'
    };
    return colors[classData.color] || 'linear-gradient(135deg, #ff6b35, #f7931e)';
  };

  const handleNewMeeting = () => {
    setShowMeetingModal(true);
    setSelectedOption(null);
    setMeetingTitle('');
    setMeetingDescription('');
    setMeetTime('');
    setMeetLink('');
    setEditingMeeting(null);
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeeting({
      ...meeting,
      id: meeting._id || meeting.id
    });
    setShowMeetingModal(true);
    setSelectedOption(meeting.type);
    setMeetingTitle(meeting.title);
    setMeetingDescription(meeting.description);
    setMeetTime(meeting.meetTime || '');
    setMeetLink(meeting.meetLink || '');
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      setIsLoading(true);
      try {
        const response = await axios.delete(
          `${BASE_URL}/api/assignments/${meetingId}/staff/${staffId}`
        );
        
        if (response.data.success) {
          setMeetings(meetings.filter(m => m._id !== meetingId && m.id !== meetingId));
          alert('Meeting deleted successfully');
        } else {
          throw new Error(response.data.message || 'Failed to delete meeting');
        }
      } catch (err) {
        console.error('Failed to delete meeting:', err.response?.data || err.message);
        alert(`Failed to delete meeting: ${err.response?.data?.message || err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleSubmitMeeting = async () => {
    if (!selectedOption || !staffId) {
      alert('Please select a meeting type and ensure you are authenticated.');
      return;
    }
    
    setIsLoading(true);
    try {
      let response;
      const meetingData = {
        classId: classData.id,
        staffId: staffId,
        type: selectedOption, // Ensure type is set correctly (e.g., 'meet-google')
        title: meetingTitle,
        description: meetingDescription,
        meetTime: meetTime,
        meetLink: meetLink
      };

      if (editingMeeting) {
        const meetingId = editingMeeting._id || editingMeeting.id;
        if (!meetingId) {
          throw new Error('No meeting ID provided for update');
        }

        response = await axios.put(
          `${BASE_URL}/api/assignments/${meetingId}/staff/${staffId}`,
          meetingData
        );
        setMeetings(meetings.map(m => 
          (m._id === meetingId || m.id === meetingId) ? response.data : m
        ));
        alert('Meeting updated successfully');
      } else {
        response = await axios.post(
          `${BASE_URL}/api/assignments/staff/${staffId}`,
          meetingData
        );
        setMeetings([response.data, ...meetings]);
        alert('Meeting created successfully');
      }

      setShowMeetingModal(false);
      setSelectedOption(null);
      setMeetingTitle('');
      setMeetingDescription('');
      setMeetTime('');
      setMeetLink('');
      setEditingMeeting(null);
      
    } catch (err) {
      console.error('Failed to save meeting:', err.response?.data || err.message);
      alert(`Failed to save meeting: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const joinMeet = (meetLink, meetType) => {
    if (!meetLink) {
      if (meetType === 'meet-google') {
        alert('No Google Meet link provided. Please edit the meeting to add a valid Google Meet link.');
      } else if (meetType === 'meet-zoom') {
        alert('No Zoom meeting link provided. Please edit the meeting to add a valid Zoom meeting link.');
      } else if (meetType === 'meet-teams') {
        alert('No Microsoft Teams meeting link provided. Please edit the meeting to add a valid Teams meeting link.');
      }
    } else {
      const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
      if (!urlRegex.test(meetLink)) {
        alert('Invalid meeting link. Please edit the meeting to provide a valid link.');
        return;
      }
      if (meetType === 'meet-google' && !meetLink.includes('meet.google.com')) {
        alert('Invalid Google Meet link. Please edit the meeting to provide a valid Google Meet link.');
        return;
      }
      if (meetType === 'meet-zoom' && !meetLink.includes('zoom.us')) {
        alert('Invalid Zoom meeting link. Please edit the meeting to provide a valid Zoom link.');
        return;
      }
      if (meetType === 'meet-teams' && !meetLink.includes('teams.microsoft.com')) {
        alert('Invalid Microsoft Teams meeting link. Please edit the meeting to provide a valid Teams link.');
        return;
      }
      window.open(meetLink, '_blank', 'noopener,noreferrer');
    }
  };

  const renderOptionContent = () => {
    if (selectedOption) {
      return (
        <div className="option-content">
          <div className="form-group">
            <label>Meeting Title</label>
            <input
              type="text"
              placeholder="Enter meeting title..."
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="assignment-input"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Meeting Time</label>
            <input
              type="text"
              placeholder="Enter meeting time (e.g., Monday 10:00 AM)..."
              value={meetTime}
              onChange={(e) => setMeetTime(e.target.value)}
              className="assignment-input"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Meeting Link</label>
            <button 
              className="create-form-btn"
              onClick={() => {
                if (selectedOption === 'meet-google') createGoogleMeet();
                else if (selectedOption === 'meet-zoom') createZoomMeeting();
                else if (selectedOption === 'meet-teams') createMicrosoftTeamsMeeting();
              }}
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} /> Create New {selectedOption === 'meet-google' ? 'Google Meet' : selectedOption === 'meet-zoom' ? 'Zoom Meeting' : 'Microsoft Teams Meeting'}
            </button>
            <div className="form-link-input">
              <FontAwesomeIcon icon={faLink} className="link-icon" />
              <input
                type="text"
                placeholder="Paste meeting link here..."
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                className="assignment-input"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Enter meeting description..."
              value={meetingDescription}
              onChange={(e) => setMeetingDescription(e.target.value)}
              className="assignment-textarea"
              disabled={isLoading}
            />
          </div>
          <div className="modal-actions">
            <button onClick={() => setSelectedOption(null)} disabled={isLoading}>
              <FontAwesomeIcon icon={faTimes} /> Back
            </button>
            <button 
              onClick={handleSubmitMeeting}
              disabled={!meetingTitle || !meetLink || isLoading}
              className="primary-btn"
            >
              {editingMeeting ? 'Update Meeting' : 'Create Meeting'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="option-content">
        <div className="option-selection">
          <div className="meeting-options">
            <div className="option-btn meet-google" onClick={() => handleOptionSelect('meet-google')}>
              <FontAwesomeIcon icon={faVideo} size="2x" />
              <span>Google Meet</span>
            </div>
            <div className="option-btn meet-zoom" onClick={() => handleOptionSelect('meet-zoom')}>
              <FontAwesomeIcon icon={faVideo} size="2x" />
              <span>Zoom Meeting</span>
            </div>
            <div className="option-btn meet-teams" onClick={() => handleOptionSelect('meet-teams')}>
              <FontAwesomeIcon icon={faVideo} size="2x" />
              <span>Microsoft Teams</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMeetings = () => {
    if (error) {
      return (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/staffhome')} className="primary-btn">
            Go to Dashboard
          </button>
        </div>
      );
    }

    if (isLoading) {
      return <div className="loading">Loading meetings...</div>;
    }

    if (meetings.length === 0) {
      return (
        <div className="no-assignments">
          <FontAwesomeIcon icon={faVideo} size="3x" />
          <h3>No meetings yet</h3>
          <p>Schedule your meeting to get started.</p>
        </div>
      );
    }

    return meetings.map(meeting => (
      <div 
        key={meeting._id || meeting.id} 
        className={`assignment-card meet-card ${meeting.type}`}
      >
        <div className="assignment-header">
          <div className="assignment-type">
            <FontAwesomeIcon icon={faVideo} />
            {meeting.type === 'meet-google' && <span>Google Meet</span>}
            {meeting.type === 'meet-zoom' && <span>Zoom Meeting</span>}
            {meeting.type === 'meet-teams' && <span>Microsoft Teams</span>}
          </div>
          <div className="assignment-date">{new Date(meeting.createdAt).toLocaleString()}</div>
        </div>
        
        <div className="assignment-title">{meeting.title}</div>
        
        {meeting.meetTime && (
          <div className="assignment-time">
            <FontAwesomeIcon icon={faClock} /> {meeting.meetTime}
          </div>
        )}
        
        {meeting.description && <div className="assignment-description">{meeting.description}</div>}
        
        <div className="meet-actions">
          <button 
            className="join-meet-btn"
            onClick={() => joinMeet(meeting.meetLink, meeting.type)}
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} /> Join {meeting.type === 'meet-google' ? 'Google Meet' : meeting.type === 'meet-zoom' ? 'Zoom' : 'Teams'}
          </button>
        </div>
        
        <div className="staff-controls">
          <button 
            className="edit-btn"
            onClick={() => handleEditMeeting(meeting)}
            title="Edit"
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button 
            className="delete-btn"
            onClick={() => handleDeleteMeeting(meeting._id || meeting.id)}
            title="Delete"
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="stream-page">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="main">
        <StaffSidebar isOpen={sidebarOpen} />
        <div className={`content ${sidebarOpen ? "" : "full-width"}`}>
          <div className="content-wrapper">
            <div className="stream-header" style={{ background: getClassBackground() }}>
              <h1>{classData.name} - {classData.section}</h1>
            </div>

            <div className="assignment-controls">
              <button 
                className="new-assignment-btn" 
                onClick={handleNewMeeting} 
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faPlus} /> Live Stream
              </button>
            </div>

            <div className="assignments-container">
              <div className="assignments-list">
                {renderMeetings()}
              </div>
            </div>
          </div>

          {/* Meeting Modal */}
          {showMeetingModal && (
            <div className="assignment-modal">
              <div className="modal-content modal-scrollable">
                <div className="modal-header">
                  <h3>{editingMeeting ? 'Edit Stream' : 'Live Stream'}</h3>
                  <button 
                    onClick={() => setShowMeetingModal(false)} 
                    disabled={isLoading}
                    aria-label="Close modal"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  {renderOptionContent()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`bottom-nav-fixed ${sidebarOpen ? "with-sidebar" : ""}`}>
        <Link to={`/staffstream/${classId}`} className="nav-item active">
          <FontAwesomeIcon icon={faStream} />
          <span>Stream</span>
        </Link>
        <Link to={`/staffassignments/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faClipboardList} />
          <span>Assignments</span>
        </Link>
        <Link to={`/staffassessment/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faClipboardList} />
          <span>Learning AID</span>
        </Link>
        <Link to={`/staffpeople/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faUsers} />
          <span>People</span>
        </Link>
        <Link to={`/staffchat/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faComments} />
          <span>Discussion Forum</span>
        </Link>
        <Link to={`/studentlogindetails/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faTrackLogin} />
          <span>Track Login</span>
        </Link>
      </div>
    </div>
  );
};

export default StaffStream;