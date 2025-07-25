import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList, faUsers, faStream, faArrowLeft,
  faUser, faExclamationTriangle, faSpinner,faComments
} from '@fortawesome/free-solid-svg-icons';
import StuNavbar from './StuNavbar';
import Sidebar from './Sidebar';
import './assessment.css';
import axios from 'axios';
import { auth } from './firebase';

function StudentAssessment() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentUnit, setCurrentUnit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [classData, setClassData] = useState({
    name: 'Loading...',
    section: '',
    teacher: '',
    color: 'orange',
    id: classId || 'default_class_id'
  });
  const [data, setData] = useState({});
  const [loadingClass, setLoadingClass] = useState(true);
  const [errorClass, setErrorClass] = useState(null);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [errorUnits, setErrorUnits] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [studentEmail, setStudentEmail] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      console.log('Auth state changed - user:', user);
      if (user) {
        console.log('User UID:', user.uid, 'Email:', user.email);
        setStudentId(user.uid);
        setStudentEmail(user.email || null);
        if (user.email) {
          fetchClassData(user.uid, user.email);
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

  const fetchClassData = async (studentId, email) => {
    if (!studentId || !classId || !email) {
      setErrorClass('Invalid student, class, or email information.');
      setLoadingClass(false);
      return;
    }

    try {
      setLoadingClass(true);
      setErrorClass(null);

      console.log('Fetching class data for studentId:', studentId, 'email:', email, 'classId:', classId);
      const response = await axios.get(`https://lms-iap4.onrender.com/api/classes/student/${studentId}?email=${encodeURIComponent(email)}`);
      console.log('Class data response:', response.data);
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

      // Fetch units after class is validated
      await fetchUnits(classId);
    } catch (err) {
      console.error('Class data fetch error:', err);
      setErrorClass(
        err.message || 'Failed to load class information. Please try again.'
      );
    } finally {
      setLoadingClass(false);
    }
  };

  const fetchUnits = async (classId) => {
    try {
      setLoadingUnits(true);
      setErrorUnits(null);

      const response = await axios.get(`https://lms-iap4.onrender.com/api/units/${classId}`);
      if (!response.data) {
        throw new Error('No units data returned');
      }
      
      const units = response.data.reduce((acc, unit) => ({
        ...acc,
        [unit._id]: {
          title: unit.title,
          date: unit.date ? new Date(unit.date).toLocaleDateString() : 'Unknown date',
          icon: faClipboardList,
          files: unit.files || []
        }
      }), {});
      
      setData(units);
    } catch (err) {
      console.error('Failed to fetch units:', err.response?.data || err.message);
      setErrorUnits('Failed to load units. Please try again.');
      setData({});
    } finally {
      setLoadingUnits(false);
    }
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const openModal = (unitKey) => {
    setCurrentUnit(unitKey);
    setSelectedFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentUnit(null);
    setSelectedFile(null);
  };

  const getClassBackground = () => {
    const colors = {
      blue: 'linear-gradient(135deg, #4285f4, #34a853)',
      green: 'linear-gradient(135deg, #34a853, #fbbc04)',
      purple: 'linear-gradient(135deg, #9c27b0, #e91e63)',
      orange: 'linear-gradient(135deg, #ff6b35, #f7931e)',
      red: 'linear-gradient(135deg, #ea4335, #fbbc04)',
      teal: 'linear-gradient(135deg, #00bcd4, #4caf50)'
    };
    return colors[classData.color] || 'linear-gradient(135deg, #ff6b35, #f7931e)';
  };

  const viewFile = (index) => {
    setSelectedFile(data[currentUnit].files[index]);
  };

  const getFileUrl = (fileId) => {
    return `https://lms-iap4.onrender.com/api/units/files/${fileId}`;
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

        <div className="header">
          <div className="title">Materials</div>
        </div>

        {loadingUnits ? (
          <div className="loading-assignments">
            <FontAwesomeIcon icon={faSpinner} spin size="3x" />
            <p>Loading units...</p>
          </div>
        ) : errorUnits ? (
          <div className="error-message">
            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
            <h3>Error Loading Units</h3>
            <p>{errorUnits}</p>
            <button className="retry-btn" onClick={() => fetchUnits(classId)}>
              Retry
            </button>
          </div>
        ) : Object.keys(data).length === 0 ? (
          <div className="no-assignments">
            <FontAwesomeIcon icon={faClipboardList} size="3x" />
            <h3>No units available</h3>
            <p>Check back later for new materials.</p>
          </div>
        ) : (
          <div className="units-grid">
            {Object.keys(data).map(key => (
              <div className="unit-card" key={key}>
                <div className="unit-info" onClick={() => openModal(key)}>
                  <div className="unit-icon">
                    <FontAwesomeIcon icon={data[key].icon} />
                  </div>
                  <div>
                    <h5>{data[key].title}</h5>
                    <div className="unit-date">Posted {data[key].date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="assessment-page">
      <StuNavbar 
        toggleSidebar={toggleSidebar} 
        dropdownOpen={dropdownOpen}
        toggleDropdown={toggleDropdown}
      />
      <div className="main">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`content ${sidebarOpen ? "" : "full-width"}`}>
          {renderContent()}
          <div className={`bottom-nav-fixed ${sidebarOpen ? "with-sidebar" : ""}`}>
            <Link to={`/stream/${classId}`} className="nav-item">
              <FontAwesomeIcon icon={faStream} />
              <span>Stream</span>
            </Link>
            <Link to={`/assessment/${classId}`} className="nav-item active">
              <FontAwesomeIcon icon={faClipboardList} />
              <span>Notes</span>
            </Link>
            <Link to={`/people/${classId}`} className="nav-item">
              <FontAwesomeIcon icon={faUsers} />
              <span>People</span>
            </Link>
            <Link to={`/chat/${classId}`} className="nav-item">
              <FontAwesomeIcon icon={faComments} />
              <span>Chat</span>
            </Link>
          </div>
          {showModal && currentUnit && (
            <div className="modal" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-header-left">
                    <button className="back-btn" onClick={closeModal}>
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <div>{data[currentUnit].title}</div>
                  </div>
                </div>
                <div className="modal-body">
                  <div className="section">
                    <div className="section-title">{data[currentUnit].title}</div>
                    <div className="unit-content">
                      <ul className="topic-list">
                        {data[currentUnit].files.map((file, index) => (
                          <li className="topic" key={file._id || index} onClick={() => viewFile(index)}>
                            <div className="topic-info">
                              <h4>{file.title}</h4>
                              <p>{file.desc || (file.type ? `${file.type} • ${file.size}` : '')}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                      {selectedFile && (
                        <div className="file-preview-section">
                          <h4>File Preview: {selectedFile.title}</h4>
                          {selectedFile.isNotes ? (
                            <div className="file-content">{selectedFile.content}</div>
                          ) : selectedFile.type?.startsWith('image/') ? (
                            <img
                              src={getFileUrl(selectedFile._id)}
                              alt={selectedFile.title}
                              className="file-preview"
                            />
                          ) : selectedFile.type?.startsWith('video/') ? (
                            <video
                              controls
                              src={getFileUrl(selectedFile._id)}
                              className="file-preview"
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : selectedFile.type?.startsWith('audio/') ? (
                            <audio
                              controls
                              src={getFileUrl(selectedFile._id)}
                              className="file-preview"
                            >
                              Your browser does not support the audio tag.
                            </audio>
                          ) : selectedFile.type === 'application/pdf' ? (
                            <iframe
                              src={getFileUrl(selectedFile._id)}
                              title={selectedFile.title}
                              className="file-preview pdf-preview"
                            ></iframe>
                          ) : selectedFile.type?.startsWith('text/') ||
                            selectedFile.type === 'application/json' ||
                            (selectedFile.name && selectedFile.name.match(/\.(txt|js|html|css|md)$/)) ? (
                            <div className="file-content">{selectedFile.content}</div>
                          ) : (
                            <div className="file-info">
                              <p>This file type cannot be previewed directly.</p>
                              <a
                                href={getFileUrl(selectedFile._id)}
                                download={selectedFile.name || selectedFile.title}
                                className="download-link"
                              >
                                Download File
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentAssessment;