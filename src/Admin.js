import React, { useState, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Papa from 'papaparse';
import './Admin.css';

// Regular expression for email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Admin() {
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [addStaffLoading, setAddStaffLoading] = useState(false);
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [staffEmails, setStaffEmails] = useState([]);
  const [studentEmails, setStudentEmails] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [staffCSV, setStaffCSV] = useState(null);
  const [studentCSV, setStudentCSV] = useState(null);
  const [bulkLoading, setBulkLoading] = useState({ staff: false, student: false });
  const [staffSearch, setStaffSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  
  // Modal states
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showStaffListModal, setShowStaffListModal] = useState(false);
  const [showStudentListModal, setShowStudentListModal] = useState(false);

  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const staffResponse = await axios.get('https://uelms.onrender.com/api/staff');
        const staff = staffResponse.data?.filter(s => s?.email).map(s => s.email.toLowerCase()) || [];
        setStaffEmails(staff);

        const studentsResponse = await axios.get('https://uelms.onrender.com/api/students');
        const students = studentsResponse.data?.filter(s => s?.email).map(s => s.email.toLowerCase()) || [];
        setStudentEmails(students);
      } catch (err) {
        alert('Failed to fetch user data: ' + err.message);
      }
    };
    fetchUsers();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setAddStaffLoading(true);

    if (!newStaffEmail) {
      alert('Staff email is required.');
      setAddStaffLoading(false);
      return;
    }
    if (!emailRegex.test(newStaffEmail)) {
      alert('Please enter a valid email address.');
      setAddStaffLoading(false);
      return;
    }
    if (!newStaffPassword || newStaffPassword.length < 6) {
      alert('Staff password must be at least 6 characters.');
      setAddStaffLoading(false);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, newStaffEmail, newStaffPassword);
      await signOut(auth);
      await axios.post('https://uelms.onrender.com/api/staff', { email: newStaffEmail });
      alert(`Staff user ${newStaffEmail} added successfully!`);
      setNewStaffEmail('');
      setNewStaffPassword('');
      const staffResponse = await axios.get('https://uelms.onrender.com/api/staff');
      setStaffEmails(staffResponse.data.filter(staff => staff && staff.email).map(staff => staff.email.toLowerCase()));
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') alert('This email is already registered.');
      else if (err.code === 'auth/invalid-email') alert('Invalid email format.');
      else if (err.code === 'auth/weak-password') alert('Password is too weak.');
      else alert(`Failed to add staff user: ${err.message}`);
    } finally {
      setAddStaffLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setAddStudentLoading(true);
    
    if (!newStudentEmail) {
      alert('Student email is required.');
      setAddStudentLoading(false);
      return;
    }
    if (!emailRegex.test(newStudentEmail)) {
      alert('Please enter a valid email address.');
      setAddStudentLoading(false);
      return;
    }
    if (!newStudentPassword || newStudentPassword.length < 6) {
      alert('Student password must be at least 6 characters.');
      setAddStudentLoading(false);
      return;
    }
    
    try {
      await createUserWithEmailAndPassword(auth, newStudentEmail, newStudentPassword);
      await signOut(auth);
      await axios.post('https://uelms.onrender.com/api/students', { email: newStudentEmail });
      alert(`Student user ${newStudentEmail} added successfully!`);
      setNewStudentEmail('');
      setNewStudentPassword('');
      const studentsResponse = await axios.get('https://uelms.onrender.com/api/students');
      setStudentEmails(studentsResponse.data.filter(student => student && student.email).map(student => student.email.toLowerCase()));
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') alert('This email is already registered.');
      else if (err.code === 'auth/invalid-email') alert('Invalid email format.');
      else if (err.code === 'auth/weak-password') alert('Password is too weak.');
      else alert(`Failed to add student user: ${err.response?.data?.error || err.message}`);
    } finally {
      setAddStudentLoading(false);
    }
  };

  const handleBulkUpload = (type) => {
    setBulkLoading((prev) => ({ ...prev, [type]: true }));

    const file = type === 'staff' ? staffCSV : studentCSV;
    if (!file) {
      alert('No file selected.');
      setBulkLoading((prev) => ({ ...prev, [type]: false }));
      return;
    }
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => value.trim(),
      complete: async (results) => {
        let users = results.data;
        users = users.filter(u =>
          u.email && u.password &&
          emailRegex.test(u.email) && u.password.length >= 6
        );

        if (users.length === 0) {
          alert('No valid rows in CSV! Ensure each row has a valid email and password (min 6 characters).');
          setBulkLoading((prev) => ({ ...prev, [type]: false }));
          return;
        }

        try {
          await axios.post(
            `https://uelms.onrender.com/api/bulk-users?type=${type}`,
            { users }
          );
          alert(`Bulk ${type} users uploaded successfully!`);
          if (type === 'staff') {
            const staffResponse = await axios.get('https://uelms.onrender.com/api/staff');
            setStaffEmails(staffResponse.data.filter(staff => staff && staff.email).map(staff => staff.email.toLowerCase()));
          } else {
            const studentsResponse = await axios.get('https://uelms.onrender.com/api/students');
            setStudentEmails(studentsResponse.data.filter(student => student && student.email).map(student => student.email.toLowerCase()));
          }
        } catch (err) {
          alert(`Bulk ${type} upload failed: ${err.response?.data?.error || err.message}`);
        } finally {
          setBulkLoading((prev) => ({ ...prev, [type]: false }));
          if (type === 'staff') setStaffCSV(null);
          else setStudentCSV(null);
        }
      },
      error: (err) => {
        alert(`Error parsing CSV: ${err.message}`);
        setBulkLoading((prev) => ({ ...prev, [type]: false }));
      }
    });
  };

  const handleDeleteUser = async (email, type) => {
    setDeleteLoading(prev => ({ ...prev, [email]: true }));

    try {
      await axios.delete('https://uelms.onrender.com/api/users', { data: { email, type } });
      alert(`User ${email} deleted successfully from ${type}.`);
      if (type === 'staff') setStaffEmails(prev => prev.filter(e => e !== email.toLowerCase()));
      else setStudentEmails(prev => prev.filter(e => e !== email.toLowerCase()));
    } catch (err) {
      alert(`Failed to delete user: ${err.response?.data?.error || err.message}`);
    } finally {
      setDeleteLoading(prev => ({ ...prev, [email]: false }));
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const closeAllModals = () => {
    setShowAddStaffModal(false);
    setShowAddStudentModal(false);
    setShowStaffListModal(false);
    setShowStudentListModal(false);
    setStaffSearch('');
    setStudentSearch('');
  };

  // Filter emails based on search input
  const filteredStaffEmails = staffEmails.filter(email =>
    email.toLowerCase().includes(staffSearch.toLowerCase())
  );
  const filteredStudentEmails = studentEmails.filter(email =>
    email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <button onClick={handleSignOut} className="signout-button">
          Logout
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card staff-card" onClick={() => setShowAddStaffModal(true)}>
          <div className="card-icon">👨‍💼</div>
          <h3>Add Staff</h3>
          <p>Add individual staff members or bulk upload via CSV</p>
        </div>

        <div className="dashboard-card student-card" onClick={() => setShowAddStudentModal(true)}>
          <div className="card-icon">👨‍🎓</div>
          <h3>Add Student</h3>
          <p>Add individual students or bulk upload via CSV</p>
        </div>

        <div className="dashboard-card staff-list-card" onClick={() => setShowStaffListModal(true)}>
          <div className="card-icon">📋</div>
          <h3>Staff List</h3>
          <p>View and manage all staff members ({staffEmails.length})</p>
        </div>

        <div className="dashboard-card student-list-card" onClick={() => setShowStudentListModal(true)}>
          <div className="card-icon">📝</div>
          <h3>Student List</h3>
          <p>View and manage all students ({studentEmails.length})</p>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="modal-overlay" onClick={closeAllModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Staff</h3>
              <button className="close-button" onClick={closeAllModals}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-section">
                <h4>Individual Staff</h4>
                <form onSubmit={handleAddStaff}>
                  <input
                    type="email"
                    placeholder="Staff Email Address"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="form-input"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Staff Password (min 6 characters)"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="form-input"
                    required
                  />
                  <button type="submit" disabled={addStaffLoading} className="primary-button">
                    {addStaffLoading ? 'Adding...' : 'Add Staff'}
                  </button>
                </form>
              </div>

              <div className="divider"></div>

              <div className="form-section">
                <h4>Bulk Upload Staff</h4>
                <div className="file-upload-section">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={e => setStaffCSV(e.target.files[0])}
                    className="file-input"
                    id="staff-csv"
                  />
                  <label htmlFor="staff-csv" className="file-label">
                    {staffCSV ? staffCSV.name : 'Choose CSV file'}
                  </label>
                  <button
                    onClick={() => handleBulkUpload('staff')}
                    disabled={bulkLoading.staff || !staffCSV}
                    className="secondary-button"
                  >
                    {bulkLoading.staff ? "Uploading..." : "Bulk Upload Staff"}
                  </button>
                  <small className="csv-info">CSV format: email, password</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={closeAllModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Student</h3>
              <button className="close-button" onClick={closeAllModals}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-section">
                <h4>Individual Student</h4>
                <form onSubmit={handleAddStudent}>
                  <input
                    type="email"
                    placeholder="Student Email Address"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    className="form-input"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Student Password (min 6 characters)"
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                    className="form-input"
                    required
                  />
                  <button type="submit" disabled={addStudentLoading} className="primary-button">
                    {addStudentLoading ? 'Adding...' : 'Add Student'}
                  </button>
                </form>
              </div>

              <div className="divider"></div>

              <div className="form-section">
                <h4>Bulk Upload Students</h4>
                <div className="file-upload-section">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={e => setStudentCSV(e.target.files[0])}
                    className="file-input"
                    id="student-csv"
                  />
                  <label htmlFor="student-csv" className="file-label">
                    {studentCSV ? studentCSV.name : 'Choose CSV file'}
                  </label>
                  <button
                    onClick={() => handleBulkUpload('student')}
                    disabled={bulkLoading.student || !studentCSV}
                    className="secondary-button"
                  >
                    {bulkLoading.student ? "Uploading..." : "Bulk Upload Students"}
                  </button>
                  <small className="csv-info">CSV format: email, password</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff List Modal */}
      {showStaffListModal && (
        <div className="modal-overlay" onClick={closeAllModals}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Staff List ({filteredStaffEmails.length})</h3>
              <button className="close-button" onClick={closeAllModals}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search staff by email..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="form-input search-input"
                />
              </div>
              {filteredStaffEmails.length === 0 ? (
                <div className="empty-state">
                  <p>{staffSearch ? 'No staff members match your search.' : 'No staff members found.'}</p>
                </div>
              ) : (
                <div className="user-list">
                  {filteredStaffEmails.map(email => (
                    <div key={email} className="user-item">
                      <span className="user-email">{email}</span>
                      <button
                        onClick={() => handleDeleteUser(email, 'staff')}
                        disabled={deleteLoading[email]}
                        className="delete-button"
                      >
                        {deleteLoading[email] ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student List Modal */}
      {showStudentListModal && (
        <div className="modal-overlay" onClick={closeAllModals}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student List ({filteredStudentEmails.length})</h3>
              <button className="close-button" onClick={closeAllModals}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search students by email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="form-input search-input"
                />
              </div>
              {filteredStudentEmails.length === 0 ? (
                <div className="empty-state">
                  <p>{studentSearch ? 'No students match your search.' : 'No students found.'}</p>
                </div>
              ) : (
                <div className="user-list">
                  {filteredStudentEmails.map(email => (
                    <div key={email} className="user-item">
                      <span className="user-email">{email}</span>
                      <button
                        onClick={() => handleDeleteUser(email, 'student')}
                        disabled={deleteLoading[email]}
                        className="delete-button"
                      >
                        {deleteLoading[email] ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;