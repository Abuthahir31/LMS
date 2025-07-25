import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStream, faClipboardList,faComments, faUsers,faUser, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StuNavbar from './StuNavbar';
import Sidebar from './Sidebar';
import axios from 'axios';
import { auth } from './firebase';
import './people.css';

function generateAvatar(name, email, photoURL) {
  const displayName = name || generateDisplayName(email);
  if (photoURL) {
    return {
      photoURL,
      initials: '',
      backgroundColor: 'transparent'
    };
  }

  const firstLetter = displayName?.charAt(0) || '?';
  return {
    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`,
    initials: firstLetter,
    backgroundColor: 'transparent'
  };
}

function generateDisplayName(email) {
  if (!email) return "Unknown User";
  const username = email.split("@")[0];
  return username
    .split(/[._]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatEmail(email) {
  if (!email) return '';
  return email.length > 20 
    ? `${email.substring(0, 15)}...@${email.split('@')[1]}`
    : email;
}

const StudentPeoplePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [people, setPeople] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePerson, setProfilePerson] = useState(null);
  const [classData, setClassData] = useState({
    name: 'Loading...',
    section: '',
    teacher: '',
    color: 'blue',
    id: null
  });
  const [studentId, setStudentId] = useState(null);
  const [studentEmail, setStudentEmail] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { classId } = useParams();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const email = user.email;
          
          if (!email) {
            throw new Error('User email not available');
          }

          setStudentId(user.uid);
          setStudentEmail(email);

          const enrollmentCheck = await axios.get(
            `https://lms-iap4.onrender.com/api/classes/${classId}/students/${user.uid}`,
            {
              params: { email },
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          if (!enrollmentCheck.data.isEnrolled) {
            throw new Error('You are not enrolled in this class');
          }

          await fetchClassDetails(classId, user.uid, email);
          await fetchPeople(classId, user.uid, email);
        } catch (err) {
          console.error('Initialization error:', err);
          setError(err.response?.data?.error || err.message);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate, classId]);

  const fetchClassDetails = async (classId, studentId, email) => {
    setIsLoading(true);
    try {
      console.log('Fetching class details for studentId:', studentId, 'email:', email, 'classId:', classId);
      const response = await axios.get(`https://lms-iap4.onrender.com/api/classes/student/${studentId}?email=${encodeURIComponent(email)}`);
      console.log('Class details response:', response.data);
      const classDataResponse = response.data.classes.find(cls => cls._id === classId);
      if (!classDataResponse) {
        throw new Error('Class not found or student not enrolled');
      }
      setClassData({
        name: classDataResponse.name,
        section: classDataResponse.section || '',
        teacher: classDataResponse.teacher || 'Unknown Teacher',
        color: classDataResponse.color || 'blue',
        id: classId
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch class details:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to load class details. Please try again or select a different class.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPeople = async (classId, studentId, email) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://lms-iap4.onrender.com/api/classes/${classId}/people/student/${studentId}`,
        {
          params: { email },
          headers: {
            'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch people');
      }

      const updatedPeople = response.data.people.map(person => {
        const displayName = person.name || generateDisplayName(person.email);
        return {
          ...person,
          name: displayName,
          displayName: displayName,
          photoURL: person.photoURL || null,
          shortEmail: formatEmail(person.email)
        };
      });

      setPeople(updatedPeople);
      setClassData(prev => ({
        ...prev,
        name: response.data.className || prev.name
      }));
      setError(null);
    } catch (err) {
      console.error('People fetch error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load class members');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPeople = people.filter(person => {
    let matchesTab =
      activeTab === "all" ||
      (activeTab === "staff" && person.role === "staff") ||
      (activeTab === "students" && person.role === "student");
    let matchesSearch =
      (person.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  function handleProfile(person) {
    setProfilePerson({
      ...person,
      name: person.name || generateDisplayName(person.email),
      displayName: person.name || generateDisplayName(person.email)
    });
    setProfileOpen(true);
  }

  const handleRetry = () => {
    setError(null);
    if (studentId && studentEmail && classId) {
      fetchClassDetails(classId, studentId, studentEmail);
      fetchPeople(classId, studentId, studentEmail);
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
      <StuNavbar 
        toggleSidebar={toggleSidebar} 
        dropdownOpen={dropdownOpen}
        toggleDropdown={toggleDropdown}
      />
      <div className="main">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`content ${sidebarOpen ? "" : "full-width"}`}>
          <div className="content-wrapper">
            <div className="stream-header" style={{ background: getClassBackground() }}>
              <h1>{classData.name} - {classData.section || 'No Section'}</h1>
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
                  <button onClick={() => navigate('/home')} className="primary-btn">
                    Go to Dashboard
                  </button>
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
                  </div>
                  <div className="tab-container">
                    <div
                      className={`tab${activeTab === "all" ? " active" : ""}`}
                      onClick={() => setActiveTab("all")}
                    >
                      All
                    </div>
                    <div
                      className={`tab${activeTab === "staff" ? " active" : ""}`}
                      onClick={() => setActiveTab("staff")}
                    >
                      Staff
                    </div>
                    <div
                      className={`tab${activeTab === "students" ? " active" : ""}`}
                      onClick={() => setActiveTab("students")}
                    >
                      Students
                    </div>
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
                            return (a.name || a.displayName).localeCompare(b.name || b.displayName);
                          })
                          .map(person => {
                            const avatar = generateAvatar(person.name, person.email, person.photoURL);
                            const roleClass =
                              person.role === "staff" ? "role-staff" : "role-student";
                            const roleText = person.role === "staff" ? "Staff" : "Student";
                            return (
                              <div
                                className="person-card"
                                key={person.id}
                                onClick={() => handleProfile(person)}
                              >
                                <div className="person-header">
                                  <div
                                    className="avatar"
                                    style={{ backgroundColor: avatar.backgroundColor }}
                                  >
                                    {avatar.photoURL ? (
                                      <img 
                                        src={avatar.photoURL} 
                                        alt={person.name || person.displayName}
                                        onError={(e) => {
                                          e.target.src = '';
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      avatar.initials
                                    )}
                                  </div>
                                  <div className="person-info">
                                    <div className="person-name">{person.name || generateDisplayName(person.email)}</div>
                                    <div 
                                      className="person-email" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleProfile(person);
                                      }}
                                    >
                                      {person.email}
                                    </div>
                                    <div className={`role-badge ${roleClass}`}>
                                      {roleText}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <FontAwesomeIcon icon={faUsers} />
                        <p>No people found</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={`bottom-nav-fixed ${sidebarOpen ? "with-sidebar" : ""}`}>
            <Link to={`/stream/${classId}`} className="nav-item">
              <FontAwesomeIcon icon={faStream} />
              <span>Stream</span>
            </Link>
            <Link to={`/assessment/${classId}`} className="nav-item">
              <FontAwesomeIcon icon={faClipboardList} />
              <span>Notes</span>
            </Link>
            <Link to={`/people/${classId}`} className="nav-item active">
              <FontAwesomeIcon icon={faUsers} />
              <span>People</span>
            </Link>
            <Link to={`/chat/${classId}`} className="nav-item">
              <FontAwesomeIcon icon={faComments} />
              <span>Chat</span>
            </Link>
          </div>
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
  );
};

const ProfileModal = ({ person, className, onClose }) => {
  const avatar = generateAvatar(person.name, person.email, person.photoURL);
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>×</span>
        <h3>{person.name || generateDisplayName(person.email)}</h3>
        
        <div className="profile-content">
          <div className="profile-header">
            <div
              className="avatar large"
              style={{ backgroundColor: avatar.backgroundColor }}
            >
              {avatar.photoURL ? (
                <img 
                  src={avatar.photoURL} 
                  alt={person.name || person.displayName}
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
              <h2>{person.name || generateDisplayName(person.email)}</h2>
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
              
              {person.role === "student" && (
                <>
                </>
              )}
              
              {person.role === "staff" && (
                <>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPeoplePage;