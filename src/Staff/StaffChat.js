import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStream, faClipboardList, faUsers, faComments,
  faPaperPlane, faSpinner, faExclamationTriangle, faClock, faTrash
} from '@fortawesome/free-solid-svg-icons';
import Navbar from './Navbar';
import StaffSidebar from './staffsidebar';
import axios from 'axios';
import { auth } from '../firebase';
import './ChatStyles.css';

const BASE_URL = 'https://uelms.onrender.com';

const StaffChat = () => {
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
  const [staffId, setStaffId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [userPhotoURL, setUserPhotoURL] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setStaffId(user.uid);
        setUserEmail(user.email || null);
        setUserPhotoURL(user.photoURL || null);
        fetchClassData(user.uid);
        fetchMessages();
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

  const fetchClassData = async (staffId) => {
    if (!staffId || !classId) {
      setError('Invalid staff or class information.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${BASE_URL}/api/classes/${classId}/staff/${staffId}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch class');
      }

      setClassData({
        name: response.data.class.name,
        section: response.data.class.section || '',
        teacher: response.data.class.teacher || 'Unknown Teacher',
        color: response.data.class.color || 'orange',
        id: classId
      });
    } catch (err) {
      console.error('Class data fetch error:', err);
      setError(err.message || 'Failed to load class information. Please try again.');
      navigate('/staffhome');
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

  const deleteAllMessages = async () => {
    if (!window.confirm('Are you sure you want to delete ALL messages in this chat? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await axios.delete(`${BASE_URL}/api/${classId}/messages`, {
        data: { staffId }
      });

      if (response.data.success) {
        setMessages([]);
      } else {
        throw new Error(response.data.error || 'Failed to delete messages');
      }
    } catch (err) {
      console.error('Failed to delete messages:', err);
      alert('Failed to delete messages. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await axios.delete(`${BASE_URL}/api/${classId}/messages/${messageId}`, {
        data: { staffId }
      });

      if (response.data.success) {
        setMessages(messages.filter(msg => msg._id !== messageId));
      } else {
        throw new Error(response.data.error || 'Failed to delete message');
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !staffId || !userEmail) return;

    try {
      const response = await axios.post(`${BASE_URL}/api/${classId}/messages`, {
        senderId: staffId,
        senderEmail: userEmail,
        senderName: auth.currentUser?.displayName || userEmail.split('@')[0] || 'Unknown',
        userType: 'staff',
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
      blue: 'linear-gradient(135deg, #4285f4, #34a853)',
      orange: 'linear-gradient(135deg, #ff6b35, #f7931e)',
      red: 'linear-gradient(135deg, #ea4335, #fbbc05)',
      green: 'linear-gradient(135deg, #34a853, #4285f4)',
      purple: 'linear-gradient(135deg, #9c27b0, #673ab7)'
    };
    return colors[classData.color] || colors.orange;
  };

  const getProfilePicUrl = (email, senderId, photoURL) => {
    if (photoURL) {
      return photoURL;
    }
    if (senderId === staffId && userPhotoURL) {
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
        <div className="staff-chat-loading-assignments">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Loading chat...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="staff-chat-error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
          <h3>Error</h3>
          <p>{error}</p>
          <button className="staff-chat-retry-btn" onClick={() => navigate('/staffhome')}>
            Go to Home
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="stream-header" style={{ background: getClassBackground() }}>
          <h1>{classData.name} {classData.section && `- ${classData.section}`}</h1>
          <div className="class-teacher">
            <FontAwesomeIcon icon={faUsers} />
            <span>{classData.teacher}</span>
          </div>
        </div>
        <div className="staff-chat-container">
          <div className="staff-chat-messages-list">
            <button
              onClick={deleteAllMessages}
              disabled={deleting || messages.length === 0}
              className="delete-all-messages-btn"
              title="Delete all messages in this chat"
            >
              {deleting ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <>
                  <FontAwesomeIcon icon={faTrash} />
                  <span>Clear All</span>
                </>
              )}
            </button>
            {messages.length === 0 ? (
              <div className="staff-chat-no-messages">
                <FontAwesomeIcon icon={faComments} size="3x" />
                <h3>No messages yet</h3>
                <p>Start the conversation by sending a message.</p>
              </div>
            ) : (
              groupMessagesByDate().map((item, index) => (
                item.type === 'date' ? (
                  <div key={`date-${index}`} className="staff-chat-date-separator">
                    {item.date}
                  </div>
                ) : (
                  <div
                    key={item.message._id}
                    className={`staff-chat-message-item ${item.message.senderId === staffId ? 'staff-chat-sent' : 'staff-chat-received'}`}
                  >
                    <img
                      src={getProfilePicUrl(item.message.senderEmail, item.message.senderId, item.message.photoURL)}
                      alt={`${item.message.senderName}'s profile`}
                      className="staff-chat-profile-pic"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${item.message.senderEmail?.charAt(0).toUpperCase() || 'U'}&background=random&color=fff&size=40`;
                      }}
                    />
                    <div className="staff-chat-message-wrapper">
                      <div className="staff-chat-sender-name">
                        <strong>
                          {item.message.senderName} {item.message.userType === 'staff' && '(Staff)'}
                        </strong>
                        <button
                          onClick={() => deleteMessage(item.message._id)}
                          className="delete-message-btn"
                          title="Delete message"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                      <div className="staff-chat-message-body">
                        <div className="staff-chat-message-content">{item.message.text}</div>
                        <div className="staff-chat-message-footer">
                          <span className="staff-chat-message-time">
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
          <div className="staff-chat-message-input">
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
      </>
    );
  };

  return (
    <div className="staff-chat-stream-page">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="staff-chat-main">
        <StaffSidebar isOpen={sidebarOpen} />
        <div className={`staff-chat-content ${sidebarOpen ? '' : 'staff-chat-full-width'}`}>
          {renderContent()}
        </div>
      </div>
      <div className={`bottom-nav-fixed ${sidebarOpen ? "with-sidebar" : ""}`}>
        <Link to={`/staffstream/${classId}`} className="nav-item">
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
        <Link to={`/staffchat/${classId}`} className="nav-item active">
          <FontAwesomeIcon icon={faComments} />
          <span>Discussion Forum</span>
        </Link>
        <Link to={`/studentlogindetails/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faClock} />
          <span>Track Login</span>
        </Link>
      </div>
    </div>
  );
};

export default StaffChat;