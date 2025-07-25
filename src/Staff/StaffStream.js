import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardCheck, faVideo, faStream,
  faClipboardList, faUsers, faPlus, faTimes,
  faQuestionCircle, faExternalLinkAlt, faClock, faLink, faEdit,
  faTrash, faEye, faChevronLeft, faDownload, faFilePdf,
  faFileWord, faFileImage, faBook, faComments,
  faIdCard,
  faNoteSticky
} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import StaffSidebar from './staffsidebar';
import '../stream.css';
import axios from 'axios';
import { auth } from '../firebase';
const BASE_URL = 'https://lms-iap4.onrender.com';

const StaffStream = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [classData, setClassData] = useState({
    name: 'Loading...',
    section: '',
    teacher: '',
    color: 'orange',
    id: null
  });
  const [staffId, setStaffId] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [meetTime, setMeetTime] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formLink, setFormLink] = useState('');
  const [assignmentType, setAssignmentType] = useState(null);
  const [showAssignmentTypeSelection, setShowAssignmentTypeSelection] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showQuestionViewModal, setShowQuestionViewModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
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
          fetchAssignments(classId, user.uid);
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

  const fetchAssignments = async (classId, staffId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/assignments/${classId}/staff/${staffId}`);
      setAssignments(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch assignments:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const createGoogleForm = () => {
    window.open('https://docs.google.com/forms/create', '_blank');
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
        return faBook;
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

  const getStudentNameFromEmail = (email, submission) => {
    if (!email) return submission.studentName || 'Unknown Student';
    const namePart = email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/\./g, ' ');
  };

  const handleNewAssignment = () => {
    setShowAssignmentModal(true);
    setSelectedOption(null);
    setAssignmentTitle('');
    setAssignmentDescription('');
    setQuestionText('');
    setMeetTime('');
    setMeetLink('');
    setAssignmentType(null);
    setShowAssignmentTypeSelection(false);
    setFormLink('');
    setEditingAssignment(null);
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment({
      ...assignment,
      id: assignment._id || assignment.id
    });
    setShowAssignmentModal(true);
    setSelectedOption(assignment.type);
    setAssignmentTitle(assignment.title);
    setAssignmentDescription(assignment.description);
    setQuestionText(assignment.question || '');
    setMeetTime(assignment.meetTime || '');
    setMeetLink(assignment.meetLink || '');
    setAssignmentType(assignment.assignmentType || null);
    setFormLink(assignment.formLink || '');
    setShowAssignmentTypeSelection(assignment.type === 'assignment');
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      setIsLoading(true);
      try {
        const response = await axios.delete(
          `${BASE_URL}/api/assignments/${assignmentId}/staff/${staffId}`
        );
        
        if (response.data.success) {
          setAssignments(assignments.filter(a => 
            a._id !== assignmentId && a.id !== assignmentId
          ));
          alert('Assignment deleted successfully');
        } else {
          throw new Error(response.data.message || 'Failed to delete assignment');
        }
      } catch (err) {
        console.error('Failed to delete assignment:', err.response?.data || err.message);
        alert(`Failed to delete assignment: ${err.response?.data?.message || err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setIsLoading(true);
    try {
      const assignmentId = assignment._id || assignment.id;
      const response = await axios.get(`${BASE_URL}/api/assignments/${assignmentId}/submissions`);
      setStudentSubmissions(response.data);
      setSelectedAssignment(assignment);
      setShowSubmissionsModal(true);
    } catch (err) {
      console.error('Failed to fetch submissions:', err.response?.data || err.message);
      alert('Failed to fetch submissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewQuestion = (assignment) => {
    setSelectedAssignment(assignment);
    setShowQuestionViewModal(true);
  };

  const handleViewForm = (assignment) => {
    setSelectedAssignment(assignment);
    setShowFormModal(true);
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      setIsLoading(true);
      try {
        await axios.delete(`${BASE_URL}/api/submissions/${submissionId}`);
        setStudentSubmissions(studentSubmissions.filter(sub => sub._id !== submissionId && sub.id !== submissionId));
        alert('Submission deleted successfully');
        await fetchAssignments(classId, staffId);
      } catch (err) {
        console.error('Failed to delete submission:', err.response?.data || err.message);
        alert('Failed to delete submission. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleAssignmentTypeSelect = (type) => {
    setAssignmentType(type);
  };

  const handleSubmitAssignment = async () => {
    if (!selectedOption || !staffId) {
      alert('Please select an option and ensure you are authenticated.');
      return;
    }
    
    setIsLoading(true);
    try {
      let response;
      const assignmentData = {
        classId: classData.id,
        staffId: staffId,
        type: selectedOption,
        title: assignmentTitle,
        description: assignmentDescription,
        assignmentType: assignmentType,
        question: assignmentType === 'question' ? questionText : null,
        formLink: assignmentType === 'form' ? formLink : null,
        meetTime: selectedOption.includes('meet') ? meetTime : null,
        meetLink: selectedOption.includes('meet') ? meetLink : null
      };

      if (editingAssignment) {
        const assignmentId = editingAssignment._id || editingAssignment.id;
        if (!assignmentId) {
          throw new Error('No assignment ID provided for update');
        }

        response = await axios.put(
          `${BASE_URL}/api/assignments/${assignmentId}/staff/${staffId}`,
          assignmentData
        );
        setAssignments(assignments.map(a => 
          (a._id === assignmentId || a.id === assignmentId) ? { ...response.data, uniqueStudentCount: a.uniqueStudentCount } : a
        ));
        alert('Assignment updated successfully');
      } else {
        response = await axios.post(
          `${BASE_URL}/api/assignments/staff/${staffId}`,
          assignmentData
        );
        setAssignments([{ ...response.data, uniqueStudentCount: 0 }, ...assignments]);
        alert('Assignment created successfully');
      }

      setShowAssignmentModal(false);
      setSelectedOption(null);
      setAssignmentTitle('');
      setAssignmentDescription('');
      setQuestionText('');
      setMeetTime('');
      setMeetLink('');
      setAssignmentType(null);
      setShowAssignmentTypeSelection(false);
      setFormLink('');
      setEditingAssignment(null);
      
    } catch (err) {
      console.error('Failed to save assignment:', err.response?.data || err.message);
      alert(`Failed to save assignment: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignmentClick = (assignment) => {
    if (assignment.type !== 'assignment') return;
    
    if (assignment.assignmentType === 'question') {
      handleViewQuestion(assignment);
    } else if (assignment.assignmentType === 'form') {
      handleViewForm(assignment);
    }
  };

  const joinMeet = (meetLink, meetType) => {
    if (!meetLink) {
      if (meetType === 'meet-google') {
        alert('No Google Meet link provided. Please edit the assignment to add a valid Google Meet link.');
      } else if (meetType === 'meet-zoom') {
        alert('No Zoom meeting link provided. Please edit the assignment to add a valid Zoom meeting link.');
      } else if (meetType === 'meet-teams') {
        alert('No Microsoft Teams meeting link provided. Please edit the assignment to add a valid Microsoft Teams meeting link.');
      }
    } else {
      const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
      if (!urlRegex.test(meetLink)) {
        alert('Invalid meeting link. Please edit the assignment to provide a valid link.');
        return;
      }
      if (meetType === 'meet-google' && !meetLink.includes('meet.google.com')) {
        alert('Invalid Google Meet link. Please edit the assignment to provide a valid Google Meet link.');
        return;
      }
      if (meetType === 'meet-zoom' && !meetLink.includes('zoom.us')) {
        alert('Invalid Zoom meeting link. Please edit the assignment to provide a valid Zoom link.');
        return;
      }
      if (meetType === 'meet-teams' && !meetLink.includes('teams.microsoft.com')) {
        alert('Invalid Microsoft Teams meeting link. Please edit the assignment to provide a valid Teams link.');
        return;
      }
      window.open(meetLink, '_blank', 'noopener,noreferrer');
    }
  };

  const renderOptionContent = () => {
    switch (selectedOption) {
      case 'meet-google':
      case 'meet-zoom':
      case 'meet-teams':
        return (
          <div className="option-content">
            <div className="form-group">
              <label>Meeting Title</label>
              <input
                type="text"
                placeholder="Enter meeting title..."
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
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
                value={assignmentDescription}
                onChange={(e) => setAssignmentDescription(e.target.value)}
                className="assignment-textarea"
                disabled={isLoading}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setSelectedOption(null)} disabled={isLoading}>
                <FontAwesomeIcon icon={faChevronLeft} /> Back
              </button>
              <button 
                onClick={handleSubmitAssignment}
                disabled={!assignmentTitle || !meetLink || isLoading}
                className="primary-btn"
              >
                {editingAssignment ? 'Update Meeting' : 'Create Meeting'}
              </button>
            </div>
          </div>
        );
      case 'assignment':
        if (!showAssignmentTypeSelection) {
          return (
            <div className="option-content">
              <div className="form-group">
                <label>Assignment Title</label>
                <input
                  type="text"
                  placeholder="Enter assignment title..."
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  className="assignment-input"
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Enter assignment description..."
                  value={assignmentDescription}
                  onChange={(e) => setAssignmentDescription(e.target.value)}
                  className="assignment-textarea"
                  disabled={isLoading}
                />
              </div>
              <div className="modal-actions">
                <button onClick={() => setSelectedOption(null)} disabled={isLoading}>
                  <FontAwesomeIcon icon={faChevronLeft} /> Back
                </button>
                <button 
                  onClick={() => setShowAssignmentTypeSelection(true)}
                  disabled={!assignmentTitle || isLoading}
                  className="primary-btn"
                >
                  Next
                </button>
              </div>
            </div>
          );
        } else {
          return (
            <div className="option-content">
              <div className="option-selection">
                <div 
                  className={`option-btn ${assignmentType === 'question' ? 'selected' : ''}`}
                  onClick={() => handleAssignmentTypeSelect('question')}
                >
                  <FontAwesomeIcon icon={faQuestionCircle} size="2x" />
                  <span>Question</span>
                </div>
                <div 
                  className={`option-btn ${assignmentType === 'form' ? 'selected' : ''}`}
                  onClick={() => handleAssignmentTypeSelect('form')}
                >
                  <FontAwesomeIcon icon={faClipboardCheck} size="2x" />
                  <span>Form</span>
                </div>
              </div>
              
              {assignmentType === 'question' && (
                <div className="form-group">
                  <label>Question</label>
                  <textarea
                    placeholder="Enter your question..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="assignment-textarea"
                    rows="5"
                    disabled={isLoading}
                  />
                  <div className="modal-actions">
                    <button onClick={() => setShowAssignmentTypeSelection(false)} disabled={isLoading}>
                      <FontAwesomeIcon icon={faChevronLeft} /> Back
                    </button>
                    <button 
                      onClick={handleSubmitAssignment}
                      disabled={!questionText || isLoading}
                      className="primary-btn"
                    >
                      {editingAssignment ? 'Update Assignment' : 'Post Assignment'}
                    </button>
                  </div>
                </div>
              )}
              
              {assignmentType === 'form' && (
                <>
                  <div className="form-group">
                    <label>Form Link</label>
                    <button 
                      className="create-form-btn"
                      onClick={createGoogleForm}
                      disabled={isLoading}
                    >
                      <FontAwesomeIcon icon={faExternalLinkAlt} /> Create New Form
                    </button>
                    
                    <div className="form-link-note">
  {/* <FontAwesomeIcon icon={faNoteSticky} className="link-icon" /> */}
  <span className="form-note-text">
     Note: Paste Your Google Form Response link here
  </span>
</div><br/>

                    <div className="form-link-input">
                      <FontAwesomeIcon icon={faLink} className="link-icon" />
                      <input
                        type="text"
                        placeholder="Paste Google Form link here"
                        value={formLink}
                        onChange={(e) => setFormLink(e.target.value)}
                        className="assignment-input"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button onClick={() => setShowAssignmentTypeSelection(false)} disabled={isLoading}>
                      <FontAwesomeIcon icon={faChevronLeft} /> Back
                    </button>
                    <button 
                      onClick={handleSubmitAssignment}
                      disabled={!formLink || isLoading}
                      className="primary-btn"
                    >
                      {editingAssignment ? 'Update Assignment' : 'Post Assignment'}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        }
      default:
        return null;
    }
  };

 
const renderAssignments = () => {
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
    return <div className="loading">Loading assignments...</div>;
  }

  if (assignments.length === 0) {
    return (
      <div className="no-assignments">
        <FontAwesomeIcon icon={faClipboardList} size="3x" />
        <h3>No assignments yet</h3>
        <p>Create your first assignment to get started.</p>
      </div>
    );
  }

  return assignments.map(assignment => (
    <div 
      key={assignment._id || assignment.id} 
      className={`assignment-card ${assignment.type.includes('meet') ? 'meet-card' : ''}`}
      onClick={() => assignment.type === 'assignment' && handleAssignmentClick(assignment)}
      style={{ cursor: assignment.type === 'assignment' ? 'pointer' : 'default' }}
    >
      <div className="assignment-header">
        <div className="assignment-type">
          {assignment.type === 'meet-google' && <FontAwesomeIcon icon={faVideo} />}
          {assignment.type === 'meet-zoom' && <FontAwesomeIcon icon={faVideo} />}
          {assignment.type === 'meet-teams' && <FontAwesomeIcon icon={faVideo} />}
          {assignment.type === 'assignment' && (
            <>
              <FontAwesomeIcon icon={faClipboardCheck} />
              <span className="assignment-number">Assignment {getAssignmentNumber(assignment._id || assignment.id)}</span>
            </>
          )}
          {assignment.type === 'meet-google' && <span>Google Meet</span>}
          {assignment.type === 'meet-zoom' && <span>Zoom Meeting</span>}
          {assignment.type === 'meet-teams' && <span>Microsoft Teams</span>}
        </div>
        <div className="assignment-date">{new Date(assignment.createdAt).toLocaleString()}</div>
      </div>
      
      <div className="assignment-title">{assignment.title}</div>
      
      {assignment.meetTime && (
        <div className="assignment-time">
          <FontAwesomeIcon icon={faClock} /> {assignment.meetTime}
        </div>
      )}
      
      {assignment.description && <div className="assignment-description">{assignment.description}</div>}
      
      {assignment.type === 'assignment' && (
        <div className="assignment-submissions">
          {assignment.assignmentType === 'question' ? (
            <div style={{ color: '#4285f4' }}>
              <FontAwesomeIcon icon={faEye} /> {assignment.uniqueStudentCount || 0} Student{assignment.uniqueStudentCount !== 1 ? 's' : ''} Submitted
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                className="view-form-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(assignment.formLink, '_blank');
                }}
                disabled={!assignment.formLink || isLoading || isFileLoading}
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} /> View Form
              </button>
            </div>
          )}
        </div>
      )}
      
      {assignment.type.includes('meet') && (
        <div className="meet-actions">
          <button 
            className="join-meet-btn"
            onClick={(e) => {
              e.stopPropagation();
              joinMeet(assignment.meetLink, assignment.type);
            }}
            disabled={isLoading || isFileLoading}
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} /> Join {assignment.type === 'meet-google' ? 'Google Meet' : assignment.type === 'meet-zoom' ? 'Zoom' : 'Teams'}
          </button>
        </div>
      )}
      
      <div className="staff-controls">
        <button 
          className="edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleEditAssignment(assignment);
          }}
          title="Edit"
          disabled={isLoading || isFileLoading}
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
        <button 
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteAssignment(assignment._id || assignment.id);
          }}
          title="Delete"
          disabled={isLoading || isFileLoading}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
        {assignment.type === 'assignment' && assignment.assignmentType === 'question' && (
          <button 
            className="submissions-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleViewSubmissions(assignment);
            }}
            title="View Submissions"
            disabled={isLoading || isFileLoading}
          >
            <FontAwesomeIcon icon={faEye} /> ({assignment.uniqueStudentCount || 0})
          </button>
        )}
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
          {isFileLoading && <div className="loading">Processing file...</div>}
          <div className="content-wrapper">
            <div className="stream-header" style={{ background: getClassBackground() }}>
              <h1>{classData.name} - {classData.section}</h1>
            </div>

            <div className="assignment-controls">
              <button 
                className="new-assignment-btn" 
                onClick={handleNewAssignment} 
                disabled={isLoading || isFileLoading}
              >
                <FontAwesomeIcon icon={faPlus} /> New Assignment
              </button>
            </div>

            <div className="assignments-container">
              <div className="assignments-list">
                {renderAssignments()}
              </div>
            </div>
          </div>

          {/* Assignment Modal */}
          {showAssignmentModal && (
            <div className="assignment-modal">
              <div className="modal-content modal-scrollable">
                <div className="modal-header">
                  <h3>{editingAssignment ? 'Edit Assignment' : 'New Assignment'}</h3>
                  <button 
                    onClick={() => setShowAssignmentModal(false)} 
                    disabled={isLoading}
                    aria-label="Close modal"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  {!selectedOption ? (
                    <div className="option-selection">
                      <div className="option-btn" onClick={() => handleOptionSelect('meet-google')}>
                        <FontAwesomeIcon icon={faVideo} size="2x" />
                        <span>Google Meet</span>
                      </div>
                      <div className="option-btn" onClick={() => handleOptionSelect('meet-zoom')}>
                        <FontAwesomeIcon icon={faVideo} size="2x" />
                        <span>Zoom Meeting</span>
                      </div>
                      <div className="option-btn" onClick={() => handleOptionSelect('meet-teams')}>
                        <FontAwesomeIcon icon={faVideo} size="2x" />
                        <span>Microsoft Teams</span>
                      </div>
                      <div className="option-btn" onClick={() => handleOptionSelect('assignment')}>
                        <FontAwesomeIcon icon={faClipboardCheck} size="2x" />
                        <span>Assignment</span>
                      </div>
                    </div>
                  ) : (
                    renderOptionContent()
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Question View Modal */}
          {showQuestionViewModal && selectedAssignment && (
            <div className="assignment-modal">
              <div className="modal-content modal-scrollable">
                <div className="modal-header">
                  <h3>Assignment {getAssignmentNumber(selectedAssignment._id || selectedAssignment.id)}</h3>
                  <button 
                    onClick={() => setShowQuestionViewModal(false)} 
                    disabled={isLoading || isFileLoading}
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
                        <strong>Assignment:</strong>
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
                </div>
                
                <div className="modal-actions">
                  <button 
                    onClick={() => {
                      setShowQuestionViewModal(false);
                      handleViewSubmissions(selectedAssignment);
                    }}
                    className="view-submissions-btn"
                    disabled={isLoading || isFileLoading}
                  >
                    <FontAwesomeIcon icon={faEye} /> View Submissions ({selectedAssignment.uniqueStudentCount || 0})
                  </button>
                  <button 
                    onClick={() => setShowQuestionViewModal(false)} 
                    disabled={isLoading || isFileLoading}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form View Modal */}
          {showFormModal && selectedAssignment && (
            <div className="assignment-modal">
              <div className="modal-content modal-scrollable">
                <div className="modal-header">
                  <h3>Assignment {getAssignmentNumber(selectedAssignment._id || selectedAssignment.id)}</h3>
                  <button 
                    onClick={() => setShowFormModal(false)} 
                    disabled={isLoading || isFileLoading}
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
                        <strong>Assignment:</strong>
                        <p>{selectedAssignment.description}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    className="view-form-btn"
                    onClick={() => window.open(selectedAssignment.formLink, '_blank')}
                    disabled={isLoading || isFileLoading || !selectedAssignment.formLink}
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} /> View Form
                  </button>
                  <button 
                    onClick={() => setShowFormModal(false)} 
                    disabled={isLoading || isFileLoading}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submissions Modal */}
          {showSubmissionsModal && selectedAssignment && (
            <div className="assignment-modal">
              <div className="modal-content submissions-modal modal-scrollable">
                <div className="modal-header">
                  <h3>Submissions for Assignment {getAssignmentNumber(selectedAssignment._id || selectedAssignment.id)}</h3>
                  <button 
                    onClick={() => setShowSubmissionsModal(false)} 
                    disabled={isLoading || isFileLoading}
                    aria-label="Close modal"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                <div className="modal-body">
                  <div className="submissions-list">
                    {isFileLoading && <div className="loading">Processing file...</div>}
                    {studentSubmissions.length === 0 ? (
                      <p>No submissions yet.</p>
                    ) : (
                      Object.entries(
                        studentSubmissions.reduce((acc, submission) => {
                          const studentId = submission.studentId;
                          if (!acc[studentId]) {
                            acc[studentId] = {
                              studentName: getStudentNameFromEmail(submission.studentEmail, submission),
                              submissions: []
                            };
                          }
                          acc[studentId].submissions.push(submission);
                          return acc;
                        }, {})
                      ).map(([studentId, { studentName, submissions }]) => (
                        <div key={studentId} className="submission-student">
                          <div className="submission-student-header">
                            <strong>{studentName}</strong>
                          </div>
                          {submissions.map(submission => (
                            <div key={submission._id || submission.id} className="submission-item">
                              <div className="submission-header">
                                <div className="student-info">
                                  <span className="submit-date">Submitted: {new Date(submission.submissionDate).toLocaleString()}</span>
                                </div>
                                <div className="submission-controls">
                                  <button 
                                    className="delete-submission-btn"
                                    onClick={() => handleDeleteSubmission(submission._id || submission.id)}
                                    title="Delete Submission"
                                    disabled={isLoading || isFileLoading}
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                </div>
                              </div>
                            
                              <div className="submission-content">
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
                                              className={`file-icon ${file.type}-icon`}
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
                                              disabled={isLoading || isFileLoading}
                                            >
                                              <FontAwesomeIcon icon={faEye} />
                                            </button>
                                            <button 
                                              className="download-file-btn"
                                              onClick={() => handleFileDownload(file)}
                                              title="Download File"
                                              disabled={isLoading || isFileLoading}
                                            >
                                              <FontAwesomeIcon icon={faDownload} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    onClick={() => setShowSubmissionsModal(false)} 
                    disabled={isLoading || isFileLoading}
                  >
                    Close
                  </button>
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
        <Link to={`/staffassessment/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faClipboardList} />
          <span>Notes</span>
        </Link>
        <Link to={`/staffpeople/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faUsers} />
          <span>People</span>
        </Link>
        <Link to={`/staffchat/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faComments} />
          <span>Chat</span>
        </Link>
        <Link to={`/studentlogindetails/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faClock} />
          <span>Track Login</span>
        </Link>
      </div>
    </div>
  );
};

export default StaffStream;