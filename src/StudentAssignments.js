import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStream, faClipboardList, faUsers, faComments,
  faUser, faExclamationTriangle, faSpinner,
  faExternalLinkAlt, faTimes, faFilePdf,
  faEye, faDownload, faFileWord, faFileImage, faFile, faUpload, faTrash
} from '@fortawesome/free-solid-svg-icons';
import StuNavbar from './StuNavbar';
import Sidebar from './Sidebar';
import './stream.css';
import axios from 'axios';
import { auth } from './firebase';

const BASE_URL = 'https://uelms.onrender.com';

const AssignmentPage = () => {
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
  const [assignments, setAssignments] = useState([]);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
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

  const fetchAssignments = async (studentId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/assignments/${classId}/student/${studentId}`);
      const assignmentData = response.data.filter(item => item.type === 'assignment');
      const uniqueAssignments = Array.from(new Map(assignmentData.map(a => [a._id || a.id, a])).values());
      setAssignments(uniqueAssignments);
    } catch (err) {
      console.error('Failed to fetch assignments:', err.response?.data || err.message);
      setErrorClass('Failed to load assignments.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissionStatus = async (studentId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/submissions/status/${classId}/student/${studentId}`);
      setSubmissionStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch submission status:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const getAssignmentNumber = (assignmentId) => {
    const sortedAssignments = [...assignments].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateA - dateB;
    });
    const index = sortedAssignments.findIndex(a => a._id === assignmentId || a.id === assignmentId);
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

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment._id || selectedAssignment.id);
      formData.append('classId', classId);
      formData.append('studentId', studentId);
      formData.append('answer', submissionText);
      submissionFiles.forEach(file => {
        formData.append('files', file);
      });
      const studentName = auth.currentUser?.email || 'Unknown Student';
      formData.append('studentName', studentName);

      await axios.post(`${BASE_URL}/api/submissions`, formData, {
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
    } finally {
      setIsLoading(false);
    }
  };

  const renderAssignments = () => {
    if (isLoading) {
      return <div className="loading">Loading assignments...</div>;
    }

    if (errorClass) {
      return (
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
          <h3>Error</h3>
          <p>{errorClass}</p>
          <button className="retry-btn" onClick={() => navigate('/home')}>
            Go to Home
          </button>
        </div>
      );
    }

    if (assignments.length === 0) {
      return (
        <div className="no-assignments">
          <FontAwesomeIcon icon={faClipboardList} size="3x" />
          <h3>No assignments yet</h3>
          <p>Check back later for assignments.</p>
        </div>
      );
    }

    return assignments.map(assignment => {
      const submissions = submissionStatus[assignment._id]?.submissions || [];
      const hasSubmitted = submissions.length > 0;

      return (
        <div
          key={assignment._id || assignment.id}
          className="assignment-card"
          style={{ marginBottom: '10px', cursor: assignment.assignmentType === 'question' ? 'pointer' : 'default' }}
          onClick={() => assignment.assignmentType === 'question' && handleOpenSubmissionModal(assignment)}
        >
          <div className="assignment-card-inner">
            <div className="assignment-header">
              <div className="assignment-type">
                <FontAwesomeIcon icon={faClipboardList} />
                <span>Assignment {getAssignmentNumber(assignment._id || assignment.id)}</span>
              </div>
              <div className="assignment-date">{new Date(assignment.createdAt).toLocaleString()}</div>
            </div>
            <div className="assignment-content">
              <div className="assignment-title">{assignment.title}</div>
              {assignment.description && (
                <div className="assignment-description">{assignment.description}</div>
              )}
              {assignment.assignmentType === 'question' && assignment.question && (
                <div className="assignment-question">
                  <strong>Question:</strong>
                  <p>{assignment.question}</p>
                </div>
              )}
              {assignment.assignmentType === 'form' && (
                <button
                  className="view-form-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(assignment.formLink, '_blank');
                  }}
                  disabled={isFileLoading || !assignment.formLink}
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} /> Open Form
                </button>
              )}
            </div>
            {assignment.assignmentType === 'question' && (
              <div className="submission-status">
                <span style={{ color: hasSubmitted ? '#34a853' : '#ea4335' }}>
                  {hasSubmitted ? 'Submitted' : 'Not Submitted'}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    });
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
          <h1>Class Not Found</h1>
          <p>{errorClass}</p>
          <button className="retry-btn" onClick={() => navigate('/home')}>
            Go to Home
          </button>
        </div>
      );
    }

    return (
      <div className="content-wrapper">
        <div
          className="stream-header"
          style={{
            background: `linear-gradient(135deg, #${classData.color === 'orange' ? 'ff6b35' : classData.color}, #${classData.color === 'orange' ? 'f7931e' : classData.color})`,
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h1>{classData.name} - {classData.section}</h1>
          <div className="class-teacher">
            <FontAwesomeIcon icon={faUser} /> {classData.teacher}
          </div>
        </div>
        <div className="assignments-container">
          <div className="assignments-list">{renderAssignments()}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="stream-page">
      <StuNavbar toggleSidebar={toggleSidebar} />
      <div className="main">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`content ${sidebarOpen ? '' : 'full-width'}`}>
          {(isFileLoading || isLoading) && <div className="loading">Processing...</div>}
          {renderContent()}
          {submissionModalOpen && selectedAssignment && selectedAssignment.assignmentType === 'question' && (
            <div className="assignment-modal">
              <div className="modal-content modal-scrollable">
                <div className="modal-header">
                  <h3>Assignment {getAssignmentNumber(selectedAssignment._id || selectedAssignment.id)}</h3>
                  <button
                    onClick={() => setSubmissionModalOpen(false)}
                    disabled={isFileLoading || isLoading}
                    aria-label="Close modal"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
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
                    {selectedAssignment.question && (
                      <div className="assignment-question">
                        <strong>Question:</strong>
                        <div className="question-text">{selectedAssignment.question}</div>
                      </div>
                    )}
                  </div>
                  <div className="submission-form">
                    <div className="form-group">
                      <label>Your Answer</label>
                      <textarea
                        placeholder="Enter your answer..."
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        className="assignment-textarea"
                        rows="5"
                        disabled={isFileLoading || isLoading}
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
                        disabled={isFileLoading || isLoading}
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
                              <FontAwesomeIcon icon={getFileIcon(file.name)} className={`file-icon`} />
                              <span className="file-name">{file.name}</span>
                              <button
                                onClick={() => handleRemoveFile(index)}
                                className="remove-file"
                                disabled={isFileLoading || isLoading}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {submissionStatus[selectedAssignment._id]?.submissions?.length > 0 && (
                      <div className="existing-submissions">
                        <h4>Your Submissions</h4>
                        {submissionStatus[selectedAssignment._id].submissions.map(submission => (
                          <div key={submission._id || submission.id} className="submission-item">
                            <div className="submission-header">
                              <span className="submit-date">
                                Submitted: {new Date(submission.submissionDate).toLocaleString()}
                              </span>
                              <button
                                className="delete-submission-btn"
                                onClick={() => handleDeleteSubmission(submission._id || submission.id)}
                                title="Delete Submission"
                                disabled={isFileLoading || isLoading}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                            {submission.answer && (
                              <div className="submission-answer">
                                <strong>Answer:</strong>
                                <p>{submission.answer}</p>
                              </div>
                            )}
                            {submission.files && submission.files.length > 0 && (
                              <div className="submission-files">
                                <strong>Uploaded Files:</strong>
                                <div className="files-list">
                                  {submission.files.map(file => (
                                    <div key={file._id || file.id} className="file-item">
                                      <div className="file-info">
                                        <FontAwesomeIcon
                                          icon={getFileIcon(file.name)}
                                          className={`file-icon`}
                                        />
                                        <div className="file-details">
                                          <span className="file-name">{file.name}</span>
                                          <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                                        </div>
                                      </div>
                                      <div className="file-actions">
                                        <button
                                          className="view-file-btn"
                                          onClick={() => handleFileView(file)}
                                          title="View File"
                                          disabled={isFileLoading || isLoading}
                                        >
                                          <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button
                                          className="download-file-btn"
                                          onClick={() => handleFileDownload(file)}
                                          title="Download File"
                                          disabled={isFileLoading || isLoading}
                                        >
                                          <FontAwesomeIcon icon={faDownload} />
                                        </button>
                                        <button
                                          className="delete-file-btn"
                                          onClick={() => handleDeleteFile(submission._id || submission.id, file._id || file.id)}
                                          title="Delete File"
                                          disabled={isFileLoading || isLoading}
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
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    onClick={handleSubmitAssignment}
                    disabled={(!submissionText && submissionFiles.length === 0) || isFileLoading || isLoading}
                    className="submit-btn"
                  >
                    <FontAwesomeIcon icon={faUpload} /> Submit
                  </button>
                  <button
                    onClick={() => setSubmissionModalOpen(false)}
                    disabled={isFileLoading || isLoading}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={`bottom-nav-fixed ${sidebarOpen ? 'with-sidebar' : ''}`}>
        <Link to={`/stream/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faStream} />
          <span>Stream</span>
        </Link>
        <Link to={`/assignments/${classId}`} className="nav-item active">
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

export default AssignmentPage;