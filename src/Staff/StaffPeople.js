import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStream, faUserSlash, faClipboardList, faUsers, faSearch, faThumbtack,
  faUser, faTrash, faEllipsisV, faUserPlus, faComments, faClock, faUpload
} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import StaffSidebar from './staffsidebar';
import axios from 'axios';
import { auth } from '../firebase';
import '../people.css';

function generateAvatar(name, email, photoURL) {
  if (photoURL) {
    return { photoURL, initials: '', backgroundColor: 'transparent' };
  }
  const displayName = name || email?.split('@')[0] || '?';
  const firstLetter = displayName?.charAt(0)?.toUpperCase() || '?';
  return {
    photoURL: `https://ui-avatars.com/api/?name=${firstLetter}&background=random&color=fff`,
    initials: firstLetter,
    backgroundColor: 'transparent'
  };
}

function formatEmail(email) {
  if (!email) return '';
  return email.length > 20
    ? `${email.substring(0, 15)}...@${email.split('@')[1]}`
    : email;
}

const PeoplePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [people, setPeople] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePerson, setProfilePerson] = useState(null);
  const [personDropdownOpen, setPersonDropdownOpen] = useState(null);
  const [classData, setClassData] = useState({
    name: 'Loading...',
    section: '',
    teacher: '',
    color: 'blue',
    id: null
  });
  const [staffId, setStaffId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [bulkStudentCSV, setBulkStudentCSV] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const navigate = useNavigate();
  const { classId } = useParams();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setStaffId(user.uid);
        const savedClassData = JSON.parse(localStorage.getItem('currentClass'));
        if (classId && savedClassData && savedClassData.id === classId) {
          setClassData(prev => ({
            ...prev,
            ...savedClassData,
            id: classId
          }));
          fetchClassDetails(classId, user.uid);
          fetchPeople(classId, user.uid);
        } else {
          setError('No class selected or invalid class ID. Please select a class from the dashboard.');
          navigate('/staffhome');
        }
      } else {
        setError('User not authenticated. Please log in.');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, classId]);

  const fetchClassDetails = async (classId, staffId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://lms-iap4.onrender.com/api/classes/${classId}/staff/${staffId}`);
      setClassData(prev => ({
        ...prev,
        ...response.data.class,
        id: classId
      }));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load class details. Please try again.');
      navigate('/staffhome');
    } finally {
      setIsLoading(false);
    }
  };
  function extractNameFromEmail(email) {
  if (!email) return 'Unknown User';
  const username = email.split('@')[0];
  // Remove numbers and special characters, then split by dots/underscores
  const cleanName = username.replace(/[0-9._-]+/g, ' ');
  // Capitalize first letter of each word
  return cleanName.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim() || 'Unknown User';
}
  
  const fetchPeople = async (classId, staffId) => {
  setIsLoading(true);
  try {
    const response = await axios.get(`https://lms-iap4.onrender.com/api/classes/${classId}/people/staff/${staffId}`);
    
    const updatedPeople = response.data.people.map(person => ({
      ...person,
      // Use the name from backend, or derive from email if not available
      displayName: person.name || extractNameFromEmail(person.email),
      photoURL: person.photoURL || null,
      shortEmail: formatEmail(person.email)
    }));
    
    setPeople(updatedPeople || []);
    setClassData(prev => ({
      ...prev,
      name: response.data.className || prev.name
    }));
    setError(null);
  } catch (err) {
    setError(err.response?.data?.error || 'Failed to load class members. Please try again.');
  } finally {
    setIsLoading(false);
  }
};


  const handleAddStudent = async () => {
  if (!studentEmail || !studentEmail.endsWith('@gmail.com')) {
    setError('Please enter a valid student Gmail address.');
    return;
  }
  setIsLoading(true);
  try {
    const response = await axios.post(
      `https://lms-iap4.onrender.com/api/classes/${classId}/people/staff/${staffId}`,
      { studentEmail }
    );
    const newStudent = response.data.data;
    setPeople(prev => [
      ...prev,
      {
        id: newStudent.studentId,
        email: studentEmail,
        name: newStudent.name || extractNameFromEmail(studentEmail),
        displayName: newStudent.name || extractNameFromEmail(studentEmail),
        shortEmail: formatEmail(studentEmail),
        role: 'student',
        photoURL: null
      }
    ]);
    setStudentEmail("");
    setAddStudentOpen(false);
    setError(null);
    setSuccess("Student added successfully.");
  } catch (err) {
    setError(err.response?.data?.error || 'Failed to add student. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const handleBulkStudentCSVChange = (e) => {
    setSuccess(null);
    setError(null);
    setBulkStudentCSV(e.target.files?.[0] ?? null);
  };


// Update the bulk add students handler
const handleBulkAddStudents = async () => {
  setSuccess(null);
  setError(null);
  if (!bulkStudentCSV) {
    setError("No student CSV file selected.");
    return;
  }
  setBulkLoading(true);

  Papa.parse(bulkStudentCSV, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const emails = results.data
        .map(row => typeof row.email === 'string' ? row.email.trim() : '')
        .filter(email => email && email.endsWith('@gmail.com'));

      if (emails.length === 0) {
        setError('No valid Gmail emails found in the CSV!');
        setBulkLoading(false);
        return;
      }

      try {
        const response = await axios.post(
          `https://lms-iap4.onrender.com/api/classes/${classId}/people/bulk/staff/${staffId}`,
          { studentEmails: emails }
        );
        
        const { addedStudents, skippedEmails } = response.data;
        
        if (Array.isArray(addedStudents) && addedStudents.length > 0) {
          setPeople(prev => [
            ...prev,
            ...addedStudents.map(student => ({
              id: student.studentId,
              email: student.email,
              name: student.name || extractNameFromEmail(student.email),
              displayName: student.name || extractNameFromEmail(student.email),
              shortEmail: formatEmail(student.email),
              role: 'student',
              photoURL: null
            }))
          ]);
        }

        let message = `${addedStudents.length} student${addedStudents.length === 1 ? '' : 's'} added successfully.`;
        if (skippedEmails?.length > 0) {
          message += ` ${skippedEmails.length} email${skippedEmails.length === 1 ? '' : 's'} skipped (already enrolled or invalid).`;
        }
        
        setSuccess(message);
        setBulkStudentCSV(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to add students. Please try again.');
      } finally {
        setBulkLoading(false);
      }
    },
    error: (error) => {
      setError('Error parsing CSV file: ' + error.message);
      setBulkLoading(false);
    }
  });
};


  const filteredPeople = people.filter(person => {
    let matchesTab =
      activeTab === "all" ||
      (activeTab === "staff" && person.role === "staff") ||
      (activeTab === "students" && person.role === "student");
    let matchesSearch =
      (person.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  useEffect(() => {
    const handleClick = e => {
      if (!e.target.closest(".menu-button") && !e.target.closest(".dropdown-menu")) {
        setPersonDropdownOpen(null);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  function handlePin(personId) {
    setPeople(people =>
      people.map(p => (p.id === personId ? { ...p, pinned: !p.pinned } : p))
    );
    setPersonDropdownOpen(null);
  }

  async function handleRemove(personId) {
    const person = people.find(p => p.id === personId);
    const personType = person?.role === "staff" ? "staff member" : "student";
    if (window.confirm(`Are you sure you want to remove this ${personType}?`)) {
      setIsLoading(true);
      try {
        await axios.delete(`https://lms-iap4.onrender.com/api/classes/${classId}/people/${personId}/staff/${staffId}`);
        setPeople(people => people.filter(p => p.id !== personId));
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to remove person. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    setPersonDropdownOpen(null);
  }

  function handleProfile(person) {
    setProfilePerson({
      ...person,
      name: person.name || person.email.split('@')[0],
      displayName: person.name || person.email.split('@')[0]
    });
    setProfileOpen(true);
    setPersonDropdownOpen(null);
  }

  const handleRetry = () => {
    setError(null);
    if (staffId && classId) {
      fetchClassDetails(classId, staffId);
      fetchPeople(classId, staffId);
    }
  };

  const getClassBackground = () => {
    const colors = {
      blue: 'linear-gradient(135deg, #4285f4, #34a853)',
      green: 'linear-gradient(135deg, #34a853, #fbbc04)',
      purple: 'linear-gradient(135deg, #9c27b0, #e91e63)',
      orange: 'linear-gradient(135deg, #ff6b35, #f7931e)',
      red: 'linear-gradient(135deg, #ea4335, #fbbc04)',
      teal: 'linear-gradient(135deg, #00bcd4, #4caf50)',
      pink: 'linear-gradient(135deg, #f06292, #e91e63)',
      indigo: 'linear-gradient(135deg, #3f51b5, #2196f3)',
      cyan: 'linear-gradient(135deg, #00bcd4, #4dd0e1)',
      amber: 'linear-gradient(135deg, #ff9800, #ff5722)'
    };
    return colors[classData.color] || 'linear-gradient(135deg, #ff6b35, #f7931e)';
  };

  return (
    <div className="stream-page">
      <Navbar
        toggleSidebar={toggleSidebar}
        dropdownOpen={dropdownOpen}
        toggleDropdown={toggleDropdown}
      />
      <div className="main">
        <StaffSidebar isOpen={sidebarOpen} />
        <div className={`content ${sidebarOpen ? "" : "full-width"}`}>
          <div className="content-wrapper">
            <div className="stream-header" style={{ background: getClassBackground() }}>
              <h1>{classData.name} - {classData.section}</h1>
              <div className="class-teacher">
                <FontAwesomeIcon icon={faUser} /> {classData.teacher}
              </div>
            </div>
            <div className="people-content">
              {error && (
                <div className="error-message">
                  <h3>Error</h3>
                  <p>{error}</p>
                  <button onClick={handleRetry} className="primary-btn">
                    Retry
                  </button>
                  <button onClick={() => navigate('/staffhome')} className="primary-btn">
                    Go to Dashboard
                  </button>
                </div>
              )}
              {success && (
                <div className="success-message">
                  <p>{success}</p>
                  <button onClick={() => setSuccess(null)} className="primary-btn">Dismiss</button>
                </div>
              )}
              {isLoading && <div className="loading">Loading people...</div>}
              {!error && !isLoading && (
                <>
                  <div className="people-header">
                    <div className="search-container">
                      <FontAwesomeIcon icon={faSearch} className="search-icon" />
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search people..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <button
                      className="primary-btn add-student-btn"
                      onClick={() => setAddStudentOpen(true)}
                    >
                      <FontAwesomeIcon icon={faUserPlus} />
                      Add Student
                    </button>
                    <button className="primary-btn add-student-btn">
                      <FontAwesomeIcon icon={faUpload} />
                      <span>Bulk Add Students CSV</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleBulkStudentCSVChange}
                        style={{ display: "none" }}
                        disabled={bulkLoading}
                      />
                    </button>
                    <button
                      className="primary-btn"
                      onClick={handleBulkAddStudents}
                      disabled={!bulkStudentCSV || bulkLoading}
                    >
                      {bulkLoading ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                  <div className="tab-container">
                    <div className={`tab${activeTab === "all" ? " active" : ""}`} onClick={() => setActiveTab("all")}>All</div>
                    <div className={`tab${activeTab === "staff" ? " active" : ""}`} onClick={() => setActiveTab("staff")}>Staff</div>
                    <div className={`tab${activeTab === "students" ? " active" : ""}`} onClick={() => setActiveTab("students")}>Students</div>
                  </div>
                  <div className="section">
                    <div className="section-header">
                      <div className="section-title">
                        <FontAwesomeIcon icon={faUsers} />
                        <span>
                          {activeTab === "all"
                            ? "All Members"
                            : activeTab === "staff"
                              ? "Staff Members"
                              : "Students"}
                        </span>
                        <span className="section-count">{filteredPeople.length}</span>
                      </div>
                    </div>
                    {filteredPeople.length > 0 ? (
                      <div className="people-grid">
                        {filteredPeople
                          .sort((a, b) => {
                            if (a.role === "staff" && b.role !== "staff") return -1;
                            if (b.role === "staff" && a.role !== "staff") return 1;
                            if (a.pinned && !b.pinned) return -1;
                            if (!a.pinned && b.pinned) return 1;
                            return (a.name || a.email).localeCompare(b.name || b.email);
                          })
                          .map(person => {
                            const avatar = generateAvatar(person.name, person.email, person.photoURL);
                            const roleClass = person.role === "staff" ? "role-staff" : "role-student";
                            const roleText = person.role === "staff" ? "Staff" : "Student";
                            return (
                              <div
                                className={`person-card${person.pinned ? " pinned" : ""}`}
                                key={person.id}
                                onClick={() => handleProfile(person)}
                              >
                                {person.pinned && person.role !== "staff" && (
                                  <div className="pinned-indicator">
                                    <FontAwesomeIcon icon={faThumbtack} />
                                  </div>
                                )}
                                <div className="person-header">
                                  <div className="avatar" style={{ backgroundColor: avatar.backgroundColor }}>
                                    {avatar.photoURL ? (
                                      <img
                                        src={avatar.photoURL}
                                        alt={person.name}
                                        onError={e => {
                                          e.target.src = '';
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      avatar.initials
                                    )}
                                  </div>
                                  <div className="person-info">
                                    <div className="person-name">{person.name}</div>
                                    <div
                                      className="person-email"
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleProfile(person);
                                      }}
                                    >
                                      {person.email}
                                    </div>
                                    <div className={`role-badge ${roleClass}`}>{roleText}</div>
                                  </div>
                                  {person.role !== "staff" && (
                                    <div className="dropdown-container">
                                      <button
                                        className="menu-button"
                                        onClick={e => {
                                          e.stopPropagation();
                                          setPersonDropdownOpen(personDropdownOpen === person.id ? null : person.id);
                                        }}
                                      >
                                        <FontAwesomeIcon icon={faEllipsisV} />
                                      </button>
                                      <div
                                        className={`dropdown-menu${personDropdownOpen === person.id ? " active" : ""}`}
                                      >
                                        <button
                                          className="dropdown-item"
                                          onClick={e => {
                                            e.stopPropagation();
                                            handlePin(person.id);
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faThumbtack} />
                                          {person.pinned ? "Unpin" : "Pin"}
                                        </button>
                                        <button
                                          className="dropdown-item"
                                          onClick={e => {
                                            e.stopPropagation();
                                            handleProfile(person);
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faUser} />
                                          View Profile
                                        </button>
                                        <button
                                          className="dropdown-item"
                                          onClick={e => {
                                            e.stopPropagation();
                                            handleRemove(person.id);
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faTrash} />
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <FontAwesomeIcon icon={faUserSlash} />
                        <p>No people found</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              {addStudentOpen && (
                <div className="assignment-modal">
                  <div className="modal-content add-student-modal">
                    <div className="modal-header">
                      <h3>Add Student</h3>
                      <button onClick={() => setAddStudentOpen(false)}>×</button>
                    </div>
                    <div className="modal-body">
                      <label htmlFor="studentEmail">Student Email:</label>
                      <input
                        type="email"
                        id="studentEmail"
                        value={studentEmail}
                        onChange={e => setStudentEmail(e.target.value)}
                        placeholder="Enter student email"
                        className="assignment-input"
                      />
                    </div>
                    <div className="modal-actions">
                      <button
                        className="primary-btn"
                        onClick={handleAddStudent}
                        disabled={isLoading}
                      >
                        {isLoading ? "Adding..." : "Add Student"}
                      </button>
                      <button
                        className="secondary-btn"
                        onClick={() => setAddStudentOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {profileOpen && profilePerson && (
                <ProfileModal
                  person={profilePerson}
                  className={classData.name}
                  onClose={() => setProfileOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={`bottom-nav-fixed ${sidebarOpen ? "with-sidebar" : ""}`}>
        <Link to={`/staffstream/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faStream} />
          <span>Stream</span>
        </Link>
        <Link to={`/staffassessment/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faClipboardList} />
          <span>Notes</span>
        </Link>
        <Link to={`/staffpeople/${classId}`} className="nav-item active">
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

const ProfileModal = ({ person, className, onClose }) => {
  const avatar = generateAvatar(person.name, person.email, person.photoURL);
  return (
    <div className="assignment-modal">
      <div className="modal-content profile-modal">
        <div className="modal-header">
          <h3>{person.name}</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="profile-content">
            <div className="profile-header">
              <div
                className="avatar large"
                style={{ backgroundColor: avatar.backgroundColor }}
              >
                {avatar.photoURL ? (
                  <img
                    src={avatar.photoURL}
                    alt={person.name}
                    onError={(e) => {
                      e.target.src = '';
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  avatar.initials
                )}
              </div>
              <div className="profile-info">
                <h2>{person.name}</h2>
                <div className={`role-badge ${person.role === "staff" ? "role-staff" : "role-student"}`}>
                  {person.role === "staff" ? "Staff Member" : "Student"}
                </div>
              </div>
            </div>
            <div className="profile-section">
              <h4>{person.role === "staff" ? "Staff Information" : "Student Information"}</h4>
              <div className="info-grid">
                <div className="info-label">Email:</div>
                <div className="info-value">{person.email || 'N/A'}</div>
                <div className="info-label">Class Name:</div>
                <div className="info-value">{className || 'N/A'}</div>
                <div className="info-label">Role:</div>
                <div className="info-value">{person.role === "staff" ? "Staff" : "Student"}</div>
                {person.role === "staff" && (
                  <>
                    <div className="info-label">Position:</div>
                    <div className="info-value">{person.position || 'N/A'}</div>
                    <div className="info-label">Department:</div>
                    <div className="info-value">{person.department || 'N/A'}</div>
                  </>
                )}
                {person.role === "student" && (
                  <>
                    <div className="info-label">Roll Number:</div>
                    <div className="info-value">{person.rollNumber || 'N/A'}</div>
                    <div className="info-label">Batch:</div>
                    <div className="info-value">{person.batch || 'N/A'}</div>
                    <div className="info-label">Major:</div>
                    <div className="info-value">{person.major || 'N/A'}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeoplePage;