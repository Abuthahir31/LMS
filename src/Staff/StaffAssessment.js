import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStream,
  faClipboardList, 
  faUsers, 
  faPlus,
  faTrashAlt, 
  faArrowLeft, 
  faFileUpload, 
  faFileAlt,
  faComments, faUser,faClock,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import StaffSidebar from './staffsidebar';
import '../assessment.css';
import axios from 'axios';

function Assessment() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentUnit, setCurrentUnit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showEditUnitModal, setShowEditUnitModal] = useState(false);
  const [showEditFileModal, setShowEditFileModal] = useState(false);
  const [editUnitId, setEditUnitId] = useState(null);
  const [editFileId, setEditFileId] = useState(null);
  const [fileType, setFileType] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    unitTitle: '',
    unitDescription: '',
    fileName: '',
    fileUpload: null,
    notesContent: ''
  });
  const [preview, setPreview] = useState(null);
  const [classData, setClassData] = useState({
    name: 'Data Structures',
    section: 'Section A',
    teacher: 'Prof. Smith',
    color: 'orange',
    id: 'default_class_id'
  });
  const [data, setData] = useState({});

  useEffect(() => {
    const savedClassData = JSON.parse(localStorage.getItem('currentClass'));
    if (savedClassData) {
      setClassData({
        ...savedClassData,
        id: savedClassData.id || 'default_class_id'
      });
    } else {
      setClassData({
        name: 'Data Structures',
        section: 'Section A',
        teacher: 'Prof. Smith',
        color: 'orange',
        id: 'default_class_id'
      });
    }

    const fetchUnits = async () => {
      try {
        const classId = savedClassData?.id || 'default_class_id';
        const response = await axios.get(`https://lms-iap4.onrender.com/api/units/${classId}`);
        const units = response.data.reduce((acc, unit) => ({
          ...acc,
          [unit._id]: {
            title: unit.title,
            date: unit.date,
            icon: faClipboardList,
            files: unit.files
          }
        }), {});
        setData(units);
      } catch (err) {
        console.error('Failed to fetch units:', err.response?.data || err.message);
      }
    };
    fetchUnits();

    if (!document.getElementById("material-symbols-font")) {
      const link = document.createElement("link");
      link.id = "material-symbols-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0";
      document.head.appendChild(link);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));

    if (name === 'fileUpload' && files && files[0]) {
      const file = files[0];
      const fileType = file.type;

      if (fileType.startsWith('image/') || fileType.startsWith('video/') || fileType.startsWith('audio/')) {
        setPreview({ type: fileType, url: URL.createObjectURL(file) });
      } else if (fileType === 'application/pdf') {
        setPreview({ type: fileType, url: URL.createObjectURL(file) });
      } else if (
        fileType.startsWith('text/') ||
        fileType === 'application/json' ||
        file.name.match(/\.(txt|js|html|css|md)$/)
      ) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview({ type: 'text', content: e.target.result });
        };
        reader.readAsText(file);
      } else {
        setPreview({ type: 'unsupported', name: file.name });
      }
    } else if (name === 'notesContent') {
      setPreview({ type: 'text', content: value });
    }
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

  const openAddFileModal = (unitKey) => {
    setCurrentUnit(unitKey);
    setShowAddFileModal(true);
    setFileType('upload');
    setFormData({
      unitTitle: '',
      unitDescription: '',
      fileName: '',
      fileUpload: null,
      notesContent: ''
    });
    setPreview(null);
  };

  const openEditUnitModal = (unitKey) => {
    setEditUnitId(unitKey);
    const unit = data[unitKey];
    const overviewFile = unit.files.find(file => file.title === 'Overview' && file.isNotes);
    setFormData({
      unitTitle: unit.title,
      unitDescription: overviewFile ? overviewFile.content : '',
      fileName: '',
      fileUpload: null,
      notesContent: ''
    });
    setShowEditUnitModal(true);
  };

  const openEditFileModal = (unitKey, fileId) => {
    setCurrentUnit(unitKey);
    setEditFileId(fileId);
    const file = data[unitKey].files.find(f => f._id === fileId);
    setFormData({
      unitTitle: '',
      unitDescription: '',
      fileName: file.title,
      fileUpload: null,
      notesContent: file.isNotes ? file.content : ''
    });
    setFileType(file.isNotes ? 'notes' : 'upload');
    setPreview(file.isNotes ? { type: 'text', content: file.content } : null);
    setShowEditFileModal(true);
  };

  const addUnit = async () => {
    const { unitTitle, unitDescription } = formData;
    if (!unitTitle.trim()) {
      alert('Please enter a unit title');
      return;
    }

    const payload = {
      unitTitle,
      unitDescription,
      classId: classData.id
    };

    try {
      const response = await axios.post('https://lms-iap4.onrender.com/api/units', payload);
      const newUnit = response.data;
      setData(prev => ({
        ...prev,
        [newUnit._id]: {
          title: newUnit.title,
          date: newUnit.date,
          icon: faClipboardList,
          files: newUnit.files
        }
      }));
      
      setFormData({
        unitTitle: '',
        unitDescription: '',
        fileName: '',
        fileUpload: null,
        notesContent: ''
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add unit:', err.response?.data || err.message);
      alert(`Failed to add unit: ${err.response?.data?.details || err.message}`);
    }
  };

  const editUnit = async () => {
    const { unitTitle, unitDescription } = formData;
    if (!unitTitle.trim()) {
      alert('Please enter a unit title');
      return;
    }

    const payload = {
      unitTitle,
      unitDescription
    };

    try {
      const response = await axios.put(`https://lms-iap4.onrender.com/api/units/${editUnitId}`, payload);
      const updatedUnit = response.data;
      setData(prev => ({
        ...prev,
        [editUnitId]: {
          title: updatedUnit.title,
          date: updatedUnit.date,
          icon: faClipboardList,
          files: updatedUnit.files
        }
      }));
      
      setFormData({
        unitTitle: '',
        unitDescription: '',
        fileName: '',
        fileUpload: null,
        notesContent: ''
      });
      setShowEditUnitModal(false);
      setEditUnitId(null);
    } catch (err) {
      console.error('Failed to update unit:', err.response?.data || err.message);
      alert(`Failed to update unit: ${err.response?.data?.details || err.message}`);
    }
  };

  const addFile = async () => {
    if (!currentUnit) return;
    const { fileName, fileUpload, notesContent } = formData;

    if (!fileName.trim()) {
      alert('Please enter a file name');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fileName', fileName);
      formDataToSend.append('fileType', fileType);
      
      if (fileType === 'upload') {
        if (!fileUpload) {
          alert('Please select a file to upload');
          return;
        }
        formDataToSend.append('fileUpload', fileUpload);
      } else {
        if (!notesContent.trim()) {
          alert('Please enter some notes');
          return;
        }
        formDataToSend.append('notesContent', notesContent);
      }

      const response = await axios.post(`https://lms-iap4.onrender.com/api/units/${currentUnit}/files`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setData(prev => ({
        ...prev,
        [currentUnit]: response.data
      }));
      
      setFormData({
        unitTitle: '',
        unitDescription: '',
        fileName: '',
        fileUpload: null,
        notesContent: ''
      });
      setPreview(null);
      setShowAddFileModal(false);
    } catch (err) {
      console.error('Failed to add file:', err.response?.data || err.message);
      alert('Failed to add file');
    }
  };

  const editFile = async () => {
    if (!currentUnit || !editFileId) return;
    const { fileName, fileUpload, notesContent } = formData;

    if (!fileName.trim()) {
      alert('Please enter a file name');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fileName', fileName);
      formDataToSend.append('fileType', fileType);
      
      if (fileType === 'upload') {
        if (fileUpload) {
          formDataToSend.append('fileUpload', fileUpload);
        }
      } else {
        if (!notesContent.trim()) {
          alert('Please enter some notes');
          return;
        }
        formDataToSend.append('notesContent', notesContent);
      }

      const response = await axios.put(`https://lms-iap4.onrender.com/api/units/${currentUnit}/files/${editFileId}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setData(prev => ({
        ...prev,
        [currentUnit]: response.data
      }));
      
      setFormData({
        unitTitle: '',
        unitDescription: '',
        fileName: '',
        fileUpload: null,
        notesContent: ''
      });
      setPreview(null);
      setShowEditFileModal(false);
      setEditFileId(null);
      setSelectedFile(null);
    } catch (err) {
      console.error('Failed to update file:', err.response?.data || err.message);
      alert(`Failed to update file: ${err.response?.data?.details || err.message}`);
    }
  };

  const deleteUnit = async (key) => {
    if (window.confirm('Delete this unit?')) {
      try {
        await axios.delete(`https://lms-iap4.onrender.com/api/units/${key}`);
        const newData = { ...data };
        delete newData[key];
        setData(newData);
      } catch (err) {
        console.error('Failed to delete unit:', err.response?.data || err.message);
        alert('Failed to delete unit');
      }
    }
  };

  const deleteFile = async (fileId) => {
    if (currentUnit && window.confirm('Delete this file?')) {
      try {
        const response = await axios.delete(`https://lms-iap4.onrender.com/api/units/${currentUnit}/files/${fileId}`);
        setData(prev => ({
          ...prev,
          [currentUnit]: response.data
        }));
        setSelectedFile(null);
      } catch (err) {
        console.error('Failed to delete file:', err.response?.data || err.message);
        alert('Failed to delete file');
      }
    }
  };

  const getClassBackground = () => {
    const colors = {
      'blue': 'linear-gradient(135deg, #4285f4, #34a853)',
      'green': 'linear-gradient(135deg, #34a853, #fbbc04)',
      'purple': 'linear-gradient(135deg, #9c27b0, #e91e63)',
      'orange': 'linear-gradient(135deg, #ff6b35, #f7931e)',
      'red': 'linear-gradient(135deg, #ea4335, #fbbc04)',
      'teal': 'linear-gradient(135deg, #00bcd4, #4caf50)'
    };
    return colors[classData.color] || 'linear-gradient(135deg, #ff6b35, #f7931e)';
  };

  const getInitials = (name) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  const viewFile = (index) => {
    setSelectedFile(data[currentUnit].files[index]);
  };

  const getFileUrl = (fileId) => {
    return `https://lms-iap4.onrender.com/api/units/files/${fileId}`;
  };

  return (
    <div className="assessment-page">
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

            <div className="header">
              <div className="title">Materials</div>
              <button className="add-btn" onClick={() => setShowAddModal(true)}>
                <FontAwesomeIcon icon={faPlus} /> Add Unit
              </button>
            </div>

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
                  <div className="unit-actions">
                    <button className="action-btn add" onClick={(e) => { e.stopPropagation(); openAddFileModal(key); }}>
                      <FontAwesomeIcon icon={faPlus} /> File
                    </button>
                    <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); openEditUnitModal(key); }}>
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); deleteUnit(key); }}>
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`bottom-nav-fixed ${sidebarOpen ? "with-sidebar" : ""}`}>
            <Link to={`/staffstream/${classData.id}`} className="nav-item">
              <FontAwesomeIcon icon={faStream} />
              <span>Stream</span>
            </Link>
            <Link to={`/staffassessment/${classData.id}`} className="nav-item active">
              <FontAwesomeIcon icon={faClipboardList} />
              <span>Notes</span>
            </Link>
            <Link to={`/staffpeople/${classData.id}`} className="nav-item">
              <FontAwesomeIcon icon={faUsers} />
              <span>People</span>
            </Link>
            <Link to={`/staffchat/${classData.id}`} className="nav-item">
              <FontAwesomeIcon icon={faComments} />
              <span>Chat</span>
            </Link>
            <Link to={`/studentlogindetails/${classData.id}`} className="nav-item">
              <FontAwesomeIcon icon={faClock} />
              <span>Track Login</span>
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
                  <button className="add-btn" onClick={() => openAddFileModal(currentUnit)}>
                    <FontAwesomeIcon icon={faPlus} /> Add File
                  </button>
                </div>
                <div className="modal-body">
                  <div className="section">
                    <div className="section-title">{data[currentUnit].title}</div>
                    <div className="unit-content">
                      <ul className="topic-list">
                        {data[currentUnit].files.map((file, index) => (
                          <li className="topic" key={file._id} onClick={() => viewFile(index)}>
                            <div className="topic-info">
                              <h4>{file.title}</h4>
                              <p>{file.desc || (file.type ? `${file.type} • ${file.size}` : '')}</p>
                            </div>
                            <div className="topic-actions">
                              <button
                                className="action-btn edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditFileModal(currentUnit, file._id);
                                }}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFile(file._id);
                                }}
                              >
                                <FontAwesomeIcon icon={faTrashAlt} />
                              </button>
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
                            selectedFile.name?.match(/\.(txt|js|html|css|md)$/) ? (
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

          {showAddModal && (
            <div className="modal" onClick={() => setShowAddModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-header-left">
                    <button className="back-btn" onClick={() => setShowAddModal(false)}>
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <div>Add New Unit</div>
                  </div>
                </div>
                <div className="modal-body">
                  <div className="input-form">
                    <input
                      type="text"
                      name="unitTitle"
                      placeholder="Unit Title (e.g., Unit IV: Trees)"
                      value={formData.unitTitle}
                      onChange={handleInputChange}
                    />
                    <textarea
                      name="unitDescription"
                      placeholder="Unit Description"
                      rows="3"
                      value={formData.unitDescription}
                      onChange={handleInputChange}
                    ></textarea>
                    <div className="form-buttons">
                      <button className="btn btn-primary" onClick={addUnit}>Add Unit</button>
                      <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showEditUnitModal && (
            <div className="modal" onClick={() => setShowEditUnitModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-header-left">
                    <button className="back-btn" onClick={() => setShowEditUnitModal(false)}>
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <div>Edit Unit</div>
                  </div>
                </div>
                <div className="modal-body">
                  <div className="input-form">
                    <input
                      type="text"
                      name="unitTitle"
                      placeholder="Unit Title (e.g., Unit IV: Trees)"
                      value={formData.unitTitle}
                      onChange={handleInputChange}
                    />
                    <textarea
                      name="unitDescription"
                      placeholder="Unit Description"
                      rows="3"
                      value={formData.unitDescription}
                      onChange={handleInputChange}
                    ></textarea>
                    <div className="form-buttons">
                      <button className="btn btn-primary" onClick={editUnit}>Update Unit</button>
                      <button className="btn btn-secondary" onClick={() => setShowEditUnitModal(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showAddFileModal && (
            <div className="modal" onClick={() => setShowAddFileModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-header-left">
                    <button className="back-btn" onClick={() => setShowAddFileModal(false)}>
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <div>Add New File</div>
                  </div>
                </div>
                <div className="modal-body">
                  <div className="input-form">
                    <input
                      type="text"
                      name="fileName"
                      placeholder="File Name"
                      value={formData.fileName}
                      onChange={handleInputChange}
                    />
                    <div className="file-type-selector">
                      <label>Choose Type:</label>
                      <div className="radio-group">
                        <label>
                          <input
                            type="radio"
                            name="fileType"
                            value="upload"
                            checked={fileType === 'upload'}
                            onChange={() => { setFileType('upload'); setPreview(null); }}
                          />
                          <span><FontAwesomeIcon icon={faFileUpload} /> Upload File</span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="fileType"
                            value="notes"
                            checked={fileType === 'notes'}
                            onChange={() => { setFileType('notes'); setPreview(formData.notesContent ? { type: 'text', content: formData.notesContent } : null); }}
                          />
                          <span><FontAwesomeIcon icon={faFileAlt} /> Add Notes</span>
                        </label>
                      </div>
                    </div>
                    {fileType === 'upload' ? (
                      <div className="upload-section">
                        <input
                          type="file"
                          id="fileUpload"
                          name="fileUpload"
                          accept="image/*,video/*,audio/*,application/pdf,application/zip,text/plain,application/json,text/html,text/css,text/markdown"
                          onChange={handleInputChange}
                        />
                        {preview && (
                          <div className="file-preview-section">
                            <h4>File Preview</h4>
                            {preview.type.startsWith('image/') ? (
                              <img src={preview.url} alt="Preview" className="file-preview" />
                            ) : preview.type.startsWith('video/') ? (
                              <video controls src={preview.url} className="file-preview">
                                Your browser does not support the video tag.
                              </video>
                            ) : preview.type.startsWith('audio/') ? (
                              <audio controls src={preview.url} className="file-preview">
                                Your browser does not support the audio tag.
                              </audio>
                            ) : preview.type === 'application/pdf' ? (
                              <iframe src={preview.url} title="PDF Preview" className="file-preview pdf-preview"></iframe>
                            ) : preview.type === 'text' ? (
                              <div className="file-content">{preview.content}</div>
                            ) : (
                              <div className="file-info">
                                <p>Preview not available for {preview.name} ({preview.type}).</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="notes-section">
                        <textarea
                          id="notesContent"
                          name="notesContent"
                          placeholder="Enter your notes here..."
                          rows="8"
                          value={formData.notesContent}
                          onChange={handleInputChange}
                        ></textarea>
                        {preview && preview.type === 'text' && (
                          <div className="file-preview-section">
                            <h4>Notes Preview</h4>
                            <div className="file-content">{preview.content}</div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="form-buttons">
                      <button className="btn btn-primary" onClick={addFile}>Add File</button>
                      <button className="btn btn-secondary" onClick={() => { setShowAddFileModal(false); setPreview(null); }}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showEditFileModal && (
            <div className="modal" onClick={() => setShowEditFileModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-header-left">
                    <button className="back-btn" onClick={() => setShowEditFileModal(false)}>
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <div>Edit File</div>
                  </div>
                </div>
                <div className="modal-body">
                  <div className="input-form">
                    <input
                      type="text"
                      name="fileName"
                      placeholder="File Name"
                      value={formData.fileName}
                      onChange={handleInputChange}
                    />
                    <div className="file-type-selector">
                      <label>Choose Type:</label>
                      <div className="radio-group">
                        <label>
                          <input
                            type="radio"
                            name="fileType"
                            value="upload"
                            checked={fileType === 'upload'}
                            onChange={() => { setFileType('upload'); setPreview(null); }}
                          />
                          <span><FontAwesomeIcon icon={faFileUpload} /> Upload File</span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="fileType"
                            value="notes"
                            checked={fileType === 'notes'}
                            onChange={() => { setFileType('notes'); setPreview(formData.notesContent ? { type: 'text', content: formData.notesContent } : null); }}
                          />
                          <span><FontAwesomeIcon icon={faFileAlt} /> Add Notes</span>
                        </label>
                      </div>
                    </div>
                    {fileType === 'upload' ? (
                      <div className="upload-section">
                        <input
                          type="file"
                          id="fileUpload"
                          name="fileUpload"
                          accept="image/*,video/*,audio/*,application/pdf,application/zip,text/plain,application/json,text/html,text/css,text/markdown"
                          onChange={handleInputChange}
                        />
                        {preview && (
                          <div className="file-preview-section">
                            <h4>File Preview</h4>
                            {preview.type.startsWith('image/') ? (
                              <img src={preview.url} alt="Preview" className="file-preview" />
                            ) : preview.type.startsWith('video/') ? (
                              <video controls src={preview.url} className="file-preview">
                                Your browser does not support the video tag.
                              </video>
                            ) : preview.type.startsWith('audio/') ? (
                              <audio controls src={preview.url} className="file-preview">
                                Your browser does not support the audio tag.
                              </audio>
                            ) : preview.type === 'application/pdf' ? (
                              <iframe src={preview.url} title="PDF Preview" className="file-preview pdf-preview"></iframe>
                            ) : preview.type === 'text' ? (
                              <div className="file-content">{preview.content}</div>
                            ) : (
                              <div className="file-info">
                                <p>Preview not available for {preview.name} ({preview.type}).</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="notes-section">
                        <textarea
                          id="notesContent"
                          name="notesContent"
                          placeholder="Enter your notes here..."
                          rows="8"
                          value={formData.notesContent}
                          onChange={handleInputChange}
                        ></textarea>
                        {preview && preview.type === 'text' && (
                          <div className="file-preview-section">
                            <h4>Notes Preview</h4>
                            <div className="file-content">{preview.content}</div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="form-buttons">
                      <button className="btn btn-primary" onClick={editFile}>Update File</button>
                      <button className="btn btn-secondary" onClick={() => { setShowEditFileModal(false); setPreview(null); setEditFileId(null); }}>Cancel</button>
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

export default Assessment;