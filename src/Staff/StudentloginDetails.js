import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStream, faClipboardList, faUsers, faComments, faClock, faSearch, faFilter, faDownload
} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import StaffSidebar from './staffsidebar';
import './logindetails.css';
import axios from 'axios';
import { auth } from '../firebase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to extract name from email
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

const StudentloginDetails = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classData, setClassData] = useState({
    name: 'Loading...',
    section: '',
    teacher: '',
    color: 'orange',
    id: null
  });
  const [staffId, setStaffId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudentSessions, setSelectedStudentSessions] = useState([]);
  const [selectedStudentName, setSelectedStudentName] = useState('');
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
          fetchSessions();
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

  useEffect(() => {
    applyFilters();
  }, [sessions, searchQuery, selectedDate]);

  const fetchClassDetails = async (classId, staffId) => {
    try {
      const response = await axios.get(`https://uelms.onrender.com/api/classes/${classId}/staff/${staffId}`);
      setClassData(prev => ({
        ...prev,
        ...response.data.class,
        id: classId
      }));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load class details.');
      navigate('/staffhome');
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://uelms.onrender.com/api/activity/class/${classId}`);
      setSessions(response.data);
      setFilteredSessions(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance sessions.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    if (searchQuery) {
      filtered = filtered.filter(session => {
        const studentName = session.name.toLowerCase();
        return studentName.includes(searchQuery.toLowerCase()) || 
               session.email.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    if (selectedDate) {
      filtered = filtered.filter(session => {
        const sessionDate = formatDate(session.inTime);
        return sessionDate === selectedDate;
      });
    }

    setFilteredSessions(filtered);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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

  const formatDuration = (inTime, outTime) => {
    if (!outTime) return '---';
    const diffMs = new Date(outTime) - new Date(inTime);
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) {
      return `${diffMins} mins`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const formatDate = (dateTimeStr) => {
    if (!dateTimeStr) return '---';
    const dt = new Date(dateTimeStr);
    const year = dt.getFullYear();
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const day = dt.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return '---';
    const dt = new Date(dateTimeStr);
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleViewSession = (studentEmail, studentName) => {
    const studentSessions = filteredSessions.filter(session => session.email === studentEmail);
    setSelectedStudentSessions(studentSessions);
    setSelectedStudentName(studentName);
    setShowViewModal(true);
  };

  const handleDateSelect = (e) => {
    setSelectedDate(e.target.value);
    setShowFilterModal(false);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Student Login Details - ${classData.name} ${classData.section}`, 14, 15);
    
    doc.setFontSize(12);
    doc.text(`Date: ${selectedDate}`, 14, 25);
    doc.text(`Teacher: ${classData.teacher}`, 14, 32);
    
    const headers = [['Student Name', 'Email', 'In Time', 'Out Time', 'Duration']];
    const tableData = filteredSessions.map(session => [
      session.name,
      session.email,
      formatTime(session.inTime),
      session.outTime ? formatTime(session.outTime) : '---',
      formatDuration(session.inTime, session.outTime)
    ]);
    
    autoTable(doc, {
      head: headers,
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    doc.save(`Student_Login_Details_${classData.name}_${selectedDate}.pdf`);
  };

  // Group sessions by student
  const groupSessionsByStudent = () => {
    const grouped = {};
    filteredSessions.forEach(session => {
      if (!grouped[session.email]) {
        grouped[session.email] = {
          name: session.name,
          email: session.email,
          count: 0
        };
      }
      grouped[session.email].count++;
    });
    return Object.values(grouped);
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
              <div className="class-teacher">
                <span><FontAwesomeIcon icon={faUsers} /> {classData.teacher}</span>
              </div>
            </div>
            <div className="filter-controls" style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="filter-input" style={{ flex: '1 0 250px', position: 'relative' }}>
                <FontAwesomeIcon icon={faSearch} className="filter-icon" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input
                  type="text"
                  placeholder="Search by student name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '30px', width: '100%' }}
                />
              </div>
              <button
                className="filter-btn"
                onClick={() => setShowFilterModal(true)}
                style={{
                  background: '#007bff',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FontAwesomeIcon icon={faFilter} />
                {selectedDate || 'Today'}
              </button>
              <button
                className="download-btn"
                onClick={generatePDF}
                disabled={filteredSessions.length === 0}
                style={{
                  background: filteredSessions.length === 0 ? '#cccccc' : '#28a745',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: filteredSessions.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FontAwesomeIcon icon={faDownload} />
                Download PDF
              </button>
            </div>

            {error ? (
              <div className="error-message">
                <h3>Error Loading Data</h3>
                <p>{error}</p>
                <button className="retry-btn" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div className="loading">
                <p>Loading attendance data...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="no-assignments">
                <h3>No Matching Records Found</h3>
                <p>No attendance records match your search or date.</p>
              </div>
            ) : (
              <div className="sessions-table-container">
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Total Sessions</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupSessionsByStudent().map((student, index) => (
                      <tr key={index} className="session-row">
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{student.count}</td>
                        <td>
                          <button
                            className="view-btn"
                            onClick={() => handleViewSession(student.email, student.name)}
                            style={{
                              background: '#007bff',
                              color: '#fff',
                              padding: '6px 12px',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilterModal && (
        <div className="modal" style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: '1100'
        }}>
          <div className="modal-content" style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3>Select Date</h3>
              <button onClick={() => setShowFilterModal(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}>×</button>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateSelect}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      )}

      {showViewModal && selectedStudentSessions.length > 0 && (
        <div className="modal" style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: '1100'
        }}>
          <div className="modal-content" style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3>{selectedStudentName}'s Login Details</h3>
              <button onClick={() => setShowViewModal(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}>×</button>
            </div>
            <div className="modal-body">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Date</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>In Time</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Out Time</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudentSessions.map((session, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDate(session.inTime)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatTime(session.inTime)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{session.outTime ? formatTime(session.outTime) : '---'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDuration(session.inTime, session.outTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
        <Link to={`/staffchat/${classId}`} className="nav-item">
          <FontAwesomeIcon icon={faComments} />
          <span>Discussion Forum</span>
        </Link>
        <Link to={`/studentlogindetails/${classId}`} className="nav-item active">
          <FontAwesomeIcon icon={faClock} />
          <span>Track Login</span>
        </Link>
      </div>
    </div>
  );
};

export default StudentloginDetails;