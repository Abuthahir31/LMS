import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStream, faClipboardList, faUsers, faComments,
  faUser, faExclamationTriangle, faSpinner,
  faClipboardCheck, faVideo, faClock, faExternalLinkAlt, faTimes, faFilePdf,
  faEye, faDownload, faFileWord, faFileImage, faFile, faUpload, faTrash
} from '@fortawesome/free-solid-svg-icons';
import StuNavbar from './StuNavbar';
import Sidebar from './Sidebar';
import './stream.css';
import axios from 'axios';
import { auth } from './firebase';

// Backend base URL for file access
const BASE_URL = 'https://lms-iap4.onrender.com';

const StudentStream = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const [assignments, setAssignments] = useState([]);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [isFileLoading, setIsFileLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      console.log('Auth state changed - user:', user);
      if (user) {
        console.log('User UID:', user.uid, 'Email:', user.email);
        setStudentId(user.uid);
        setStudentEmail(user.email || null);
        if (user.email) {
          fetchClassData(user.uid, user.email);
          fetchAssignments(user.uid);
          fetchSubmissionStatus(user.uid);
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

      console.log('Fetching class data for studentId:', studentId, 'email:', email, 'classId:', classId);
      const response = await axios.get(`${BASE_URL}/api/classes/student/${studentId}?email=${encodeURIComponent(email)}`);
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
    } catch (err) {
      console.error('Class data fetch error:', err);
      setErrorClass(
        err.message || 'Failed to load class information. Please try again.'
      );
    } finally {
      setLoadingClass(false);
    }
  };

  const fetchAssignments = async (studentId) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/assignments/${classId}/student/${studentId}`);
      setAssignments(response.data);
    } catch (err) {
      console.error('Failed to fetch assignments:', err.response?.data || err.message);
    }
  };

  const fetchSubmissionStatus = async (studentId) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/submissions/status/${classId}/student/${studentId}`);
      setSubmissionStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch submission status:', err.response?.data || err.message);
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

  const getAssignmentNumber = (assignmentId) => {
    const filteredAssignments = assignments.filter(a => a.type === 'assignment').sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateA - dateB;
    });
    const index = filteredAssignments.findIndex(a => a._id === assignmentId || a.id === assignmentId);
    return index + 1;
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return faFilePdf;
      case 'doc':
      case 'docx':
        return faFileWord;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return faFileImage;
      default:
        return faFile;
    }
  };

  const handleFileView = async (file) => {
    if (!file.url) {
      alert('File URL is not available.');
      return;
    }

    setIsFileLoading(true);
    try {
      const fileUrl = file.url.startsWith('http') ? file.url : `${BASE_URL}${file.url}`;
      await axios.head(fileUrl);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to access file:', err.response?.data || err.message);
      alert('Failed to access file. It may not exist or is inaccessible.');
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleFileDownload = async (file) => {
    if (!file.url) {
      alert('File URL is not available.');
      return;
    }

    setIsFileLoading(true);
    try {
      const fileUrl = file.url.startsWith('http') ? file.url : `${BASE_URL}${file.url}`;
      const response = await axios.get(fileUrl, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download file:', err.response?.data || err.message);
      alert('Failed to download file. Please try again.');
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleDeleteFile = async (submissionId, fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    setIsFileLoading(true);
    try {
      await axios.delete(`${BASE_URL}/api/submissions/${submissionId}/file/${fileId}`);
      await fetchSubmissionStatus(studentId);
      alert('File deleted successfully.');
    } catch (err) {
      console.error('Failed to delete file:', err.response?.data || err.message);
      alert(`Failed to delete file: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;

    setIsFileLoading(true);
    try {
      await axios.delete(`${BASE_URL}/api/submissions/${submissionId}`);
      await fetchSubmissionStatus(studentId);
      alert('Submission deleted successfully.');
    } catch (err) {
      console.error('Failed to delete submission:', err.response?.data || err.message);
      alert(`Failed to delete submission: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleOpenSubmissionModal = (assignment) => {
    setSelectedAssignment(assignment);
    const existingSubmission = submissionStatus[assignment._id]?.submissions || [];
    setSubmissionText(existingSubmission.length > 0 ? existingSubmission[0].answer || '' : '');
    setSubmissionFiles([]);
    setSubmissionModalOpen(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSubmissionFiles(prevFiles => [...prevFiles, ...files]);
  };

  const handleRemoveFile = (indexToRemove) => {
    setSubmissionFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !studentId) return;

    try {
      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment._id || selectedAssignment.id);
      formData.append('classId', classId);
      formData.append('studentId', studentId);
      formData.append('answer', submissionText);
      submissionFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('studentName', auth.currentUser?.displayName || 'Unknown Student');

      const response = await axios.post(`${BASE_URL}/api/submissions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmissionModalOpen(false);
      setSubmissionText('');
      setSubmissionFiles([]);
      await fetchSubmissionStatus(studentId);
      alert('Submission successful!');
    } catch (err) {
      console.error('Failed to submit assignment:', err.response?.data || err.message);
      alert(`Failed to submit assignment: ${err.response?.data?.message || err.message}`);
    }
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
      // Validate the link before opening
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

  const renderAssignments = () => {
    if (assignments.length === 0) {
      return (
        <div className="no-assignments">
          <FontAwesomeIcon icon={faClipboardList} size="3x" />
          <h3>No assignments yet</h3>
          <p>Check back later for assignments and announcements.</p>
        </div>
      );
    }

    return assignments.map(assignment => (
      <div
        key={assignment._id || assignment.id}
        className={`assignment-card ${assignment.type.includes('meet') ? 'meet-card' : ''}`}
        onClick={() => assignment.type === 'assignment' && handleOpenSubmissionModal(assignment)}
        style={{ cursor: assignment.type === 'assignment' ? 'pointer' : 'default' }}
      >
        <div className="assignment-card-inner">
          <div className="assignment-header">
            <div className="assignment-type">
              {assignment.type === 'meet-google' && <FontAwesomeIcon icon={faVideo} />}
              {assignment.type === 'meet-zoom' && <FontAwesomeIcon icon={faVideo} />}
              {assignment.type === 'meet-teams' && <FontAwesomeIcon icon={faVideo} />}
              {assignment.type === 'assignment' && (
                <div className="assignment-type-inner">
                  <FontAwesomeIcon icon={faClipboardCheck} />
                  <span className="assignment-number">Assignment {getAssignmentNumber(assignment._id || assignment.id)}</span>
                </div>
              )}
              {assignment.type === 'meet-google' && <span>Google Meet</span>}
              {assignment.type === 'meet-zoom' && <span>Zoom Meeting</span>}
              {assignment.type === 'meet-teams' && <span>Microsoft Teams</span>}
            </div>
            <div className="assignment-date">{new Date(assignment.createdAt).toLocaleString()}</div>
          </div>

          <div className="assignment-content">
            <div className="assignment-title">{assignment.title}</div>

            {assignment.meetTime && (
              <div className="assignment-time">
                <FontAwesomeIcon icon={faClock} />
                <span>{assignment.meetTime}</span>
              </div>
            )}

            {assignment.description && (
              <div className="assignment-description">{assignment.description}</div>
            )}
          </div>

          {assignment.type.includes('meet') && (
            <div className="meet-actions">
              <button
                className="join-meet-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  joinMeet(assignment.meetLink, assignment.type);
                }}
                disabled={isFileLoading}
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} /> Join {assignment.type === 'meet-google' ? 'Google Meet' : assignment.type === 'meet-zoom' ? 'Zoom' : 'Teams'}
              </button>
            </div>
          )}

          {assignment.type === 'assignment' && (
            <div className="submission-status">
              {submissionStatus[assignment._id]?.submissions?.length > 0 ? (
                submissionStatus[assignment._id].submissions.map((submission, index) => (
                  <div key={submission._id || submission.id || index} className="submitted">
                    <div className="submission-header">
                      <span><strong>Submission {index + 1}:</strong> {new Date(submission.submissionDate).toLocaleString()}</span>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubmission(submission._id);
                        }}
                        disabled={isFileLoading}
                        title="Delete Submission"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                    {submission.answer && (
                      <div className="submission-answer">
                        <strong>Answer:</strong> {submission.answer}
                      </div>
                    )}
                    {submission.files && submission.files.length > 0 && (
                      <div className="submission-files">
                        <strong>Files:</strong>
                        <div className="files-list">
                          {submission.files.map(file => (
                            <div key={file._id || file.id} className="file-item">
                              <FontAwesomeIcon icon={getFileIcon(file.name)} className={`file-icon ${file.type}-icon`} />
                              <span className="file-name">{file.name}</span>
                              <div className="file-actions">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileView(file);
                                  }}
                                  disabled={isFileLoading}
                                  title="View File"
                                >
                                  <FontAwesomeIcon icon={faEye} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileDownload(file);
                                  }}
                                  disabled={isFileLoading}
                                  title="Download File"
                                >
                                  <FontAwesomeIcon icon={faDownload} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(submission._id, file._id);
                                  }}
                                  disabled={isFileLoading}
                                  title="Delete File"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="not-submitted">
                  <strong>Not submitted</strong>
                </div>
              )}
            </div>
          )}
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
            {renderAssignments()}
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
          {isFileLoading && <div className="loading">Processing file...</div>}
          {renderContent()}
          {submissionModalOpen && selectedAssignment && (
            <div className="assignment-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Submit Assignment {getAssignmentNumber(selectedAssignment._id || selectedAssignment.id)}</h3>
                  <button
                    onClick={() => setSubmissionModalOpen(false)}
                    disabled={isFileLoading}
                    aria-label="Close modal"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <div className="modal-scrollable-content">
                  <div className="modal-body">
                    <div className="assignment-details">
                      <div className="assignment-title">
                        <strong>{selectedAssignment.title}</strong>
                      </div>
                      {selectedAssignment.description && (
                        <div className="assignment-description">
                          <strong>Description:</strong>
                          <p>{selectedAssignment.description}</p>
                        </div>
                      )}
                      {selectedAssignment.assignmentType === 'question' && (
                        <div className="assignment-question">
                          <strong>Question:</strong>
                          <div className="question-text">{selectedAssignment.question}</div>
                        </div>
                      )}
                      {selectedAssignment.assignmentType === 'form' && (
                        <div className="assignment-form">
                          <button
                            className="view-form-btn"
                            onClick={() => window.open(selectedAssignment.formLink, '_blank')}
                            disabled={isFileLoading}
                          >
                            <FontAwesomeIcon icon={faExternalLinkAlt} /> View Form
                          </button>
                        </div>
                      )}
                    </div>
                    {selectedAssignment.assignmentType === 'question' && (
                      <div className="submission-form">
                        <div className="form-group">
                          <label>Your Answer</label>
                          <textarea
                            placeholder="Enter your answer..."
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            className="assignment-textarea"
                            rows="5"
                            disabled={isFileLoading}
                          />
                        </div>
                        <div className="form-group file-upload-section">
                          <label>Upload Files</label>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="file-input"
                            id="fileInput"
                            disabled={isFileLoading}
                          />
                          <label htmlFor="fileInput" className="upload-area">
                            <FontAwesomeIcon icon={faUpload} className="upload-icon" />
                            <div className="upload-text">Drag and drop or click to upload</div>
                            <div className="upload-subtext">Supports PDF, DOCX, JPG, PNG</div>
                          </label>
                          {submissionFiles.length > 0 && (
                            <div className="file-list">
                              {submissionFiles.map((file, index) => (
                                <div key={index} className="file-item">
                                  <FontAwesomeIcon icon={getFileIcon(file.name)} className={`file-icon ${file.type}-icon`} />
                                  <span className="file-name">{file.name}</span>
                                  <button
                                    onClick={() => handleRemoveFile(index)}
                                    className="remove-file"
                                    disabled={isFileLoading}
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-actions">
                    {selectedAssignment.assignmentType === 'question' && (
                      <button
                        onClick={handleSubmitAssignment}
                        disabled={(!submissionText && submissionFiles.length === 0) || isFileLoading}
                        className="submit-btn"
                      >
                        <FontAwesomeIcon icon={faUpload} /> Submit
                      </button>
                    )}
                    <button
                      onClick={() => setSubmissionModalOpen(false)}
                      disabled={isFileLoading}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={`bottom-nav-fixed ${sidebarOpen ? "with-sidebar" : ""}`}>
        <Link to={`/stream/${classId}`} className="nav-item active">
          <FontAwesomeIcon icon={faStream} />
          <span>Stream</span>
        </Link>
        <Link to={`/assessment/${classId}`} className="nav-item">
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
    </div>
  );
};

export default StudentStream;