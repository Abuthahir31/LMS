import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStream, faClipboardList, faUsers, faComments,
  faPaperPlane, faSpinner, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import StuNavbar from './StuNavbar';
import Sidebar from './Sidebar';
import axios from 'axios';
import { auth } from './firebase';

const BASE_URL = 'https://uelms.onrender.com';

const StudentChat = () => {
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
  const [studentId, setStudentId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [userPhotoURL, setUserPhotoURL] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setStudentId(user.uid);
        setUserEmail(user.email || null);
        setUserPhotoURL(user.photoURL || null);
        if (user.email) {
          fetchClassData(user.uid, user.email);
          fetchMessages();
        } else {
          setError('No email found. Please update your email in your profile.');
          setLoading(false);
        }
      } else {
        setError('User not authenticated. Please log in.');
        setLoading(false);
        navigate('/login');
      }
    });

    if (!document.getElementById("material-symbols-font")) {
      const link = document.createElement("link");
      link.id = "material-symbols-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0";
      document.head.appendChild(link);
    }

    const interval = setInterval(fetchMessages, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [navigate, classId]);

  const fetchClassData = async (studentId, email) => {
    if (!studentId || !classId || !email) {
      setError('Invalid student, class, or email information.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${BASE_URL}/api/classes/student/${studentId}?email=${encodeURIComponent(email)}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch classes');
      }

      const targetClass = response.data.classes.find(cls => cls._id === classId);
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
      console.error('Class data fetch error:', err);
      setError(err.message || 'Failed to load class information. Please try again.');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/${classId}/messages`);
      if (response.data.success) {
        setMessages(response.data.messages);
        scrollToBottom();
      } else {
        throw new Error(response.data.error || 'Failed to fetch messages');
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load messages. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !studentId || !userEmail) return;

    try {
      const response = await axios.post(`${BASE_URL}/api/${classId}/messages`, {
        senderId: studentId,
        senderEmail: userEmail,
        senderName: auth.currentUser?.displayName || userEmail.split('@')[0] || 'Unknown',
        userType: 'student',
        text: newMessage,
        photoURL: auth.currentUser?.photoURL || undefined
      });

      if (response.data.success) {
        setMessages([...messages, response.data.message]);
        setNewMessage('');
        scrollToBottom();
      } else {
        throw new Error(response.data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const getProfilePicUrl = (email, senderId, photoURL) => {
    if (photoURL) {
      return photoURL;
    }
    if (senderId === studentId && userPhotoURL) {
      return userPhotoURL;
    }
    const firstLetter = email?.charAt(0).toUpperCase() || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&background=random&color=fff&size=40`;
  };

  const groupMessagesByDate = () => {
    const grouped = [];
    let lastDate = null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp);
      const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
      const diffTime = today - messageDay;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let dateLabel;
      if (diffDays === 0) {
        dateLabel = 'Today';
      } else if (diffDays === 1) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = messageDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      if (dateLabel !== lastDate) {
        grouped.push({ type: 'date', date: dateLabel });
        lastDate = dateLabel;
      }
      grouped.push({ type: 'message', message });
    });

    return grouped;
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="student-chat-loading-assignments">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Loading chat...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="student-chat-error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
          <h3>Error</h3>
          <p>{error}</p>
          <button className="student-chat-retry-btn" onClick={() => navigate('/home')}>
            Go to Home
          </button>
        </div>
      );
    }

    return (
      <div className="student-chat-content-wrapper">
        <div className="student-chat-stream-header" style={{ background: getClassBackground() }}>
          <h1>{classData.name} - {classData.section}</h1>
          <div className="student-chat-class-teacher">
            <FontAwesomeIcon icon={faUsers} /> {classData.teacher}
          </div>
        </div>
        <div className="student-chat-container">
          <div className="student-chat-messages-list">
            {messages.length === 0 ? (
              <div className="student-chat-no-messages">
                <FontAwesomeIcon icon={faComments} size="3x" />
                <h3>No messages yet</h3>
                <p>Start the conversation by sending a message.</p>
              </div>
            ) : (
              groupMessagesByDate().map((item, index) => (
                item.type === 'date' ? (
                  <div key={`date-${index}`} className="student-chat-date-separator">
                    {item.date}
                  </div>
                ) : (
                  <div
                    key={item.message._id}
                    className={`student-chat-message-item ${item.message.senderId === studentId ? 'student-chat-sent' : 'student-chat-received'}`}
                  >
                    <img
                      src={getProfilePicUrl(item.message.senderEmail, item.message.senderId, item.message.photoURL)}
                      alt={`${item.message.senderName}'s profile`}
                      className="student-chat-profile-pic"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${item.message.senderEmail?.charAt(0).toUpperCase() || 'U'}&background=random&color=fff&size=40`;
                      }}
                    />
                    <div className="student-chat-message-wrapper">
                      <div className="student-chat-sender-name">
                        <strong>
                          {item.message.senderName} {item.message.userType === 'staff' && '(Staff)'}
                        </strong>
                      </div>
                      <div className="student-chat-message-body">
                        <div className="student-chat-message-content">{item.message.text}</div>
                        <div className="student-chat-message-footer">
                          <span className="student-chat-message-time">
                            {formatMessageTime(item.message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="student-chat-message-input">
            <textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              className="staff-chat-message-textarea"
              rows="1"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || loading}
              className="staff-chat-send-message-btn"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="student-chat-stream-page">
      <StuNavbar toggleSidebar={toggleSidebar} />
      <div className="student-chat-main">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`student-chat-content ${sidebarOpen ? '' : 'student-chat-full-width'}`}>
          {renderContent()}
        </div>
      </div>
      <div className={`bottom-nav-fixed ${sidebarOpen ? "with-sidebar" : ""}`}>
        <Link to={`/stream/${classId}`} className="nav-item">
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
        <Link to={`/chat/${classId}`} className="nav-item active">
          <FontAwesomeIcon icon={faComments} />
          <span>Discussion Forum</span>
        </Link>
      </div>
    </div>
  );
};

export default StudentChat;