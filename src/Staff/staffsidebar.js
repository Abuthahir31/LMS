import React, { useState, useEffect } from "react";
import "../Sidebar.css";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from 'axios';

const StaffSidebar = ({ isOpen }) => {
  const [classes, setClasses] = useState([]);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchClasses(currentUser.uid);
      } else {
        setLoading(false);
        setClasses([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchClasses = async (userId) => {
    try {
      setLoading(true);
      const response = await axios.get(`https://uelms.onrender.com/api/classes?staffId=${userId}`);
      const staffClasses = response.data.classes.filter(cls => cls.staffId === userId);
      setClasses(staffClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError(error.response?.data?.error || error.message);
      setClasses([]);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (
        now.getDate() !== currentDate.getDate() ||
        now.getMonth() !== currentDate.getMonth() ||
        now.getFullYear() !== currentDate.getFullYear()
      ) {
        setCurrentDate(now);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentDate]);

  const handleHomeClick = () => {
    setActiveItem('home');
    setIsClassDropdownOpen(false);
    setShowCalendar(false);
    window.location.href = '/staffhome';
  };

  const handleClassClick = () => {
    setActiveItem('classes');
    setIsClassDropdownOpen(!isClassDropdownOpen);
    setShowCalendar(false);
  };

  const handleClassItemClick = (classObj) => {
    setActiveItem(`class-${classObj._id}`);
    setShowCalendar(false);
    localStorage.setItem(
      "currentClass",
      JSON.stringify({
        id: classObj._id,
        name: classObj.name,
        section: classObj.section,
        teacher: classObj.teacher,
        color: classObj.color,
      })
    );
    window.location.href = `/staffstream/${classObj._id}`;
  };

  const handleCalendarClick = () => {
    setActiveItem('calendar');
    setShowCalendar(!showCalendar);
    setIsClassDropdownOpen(false);
  };

  const handleHelpClick = () => {
    setActiveItem('help');
    setShowCalendar(false);
    setIsClassDropdownOpen(false);
    window.location.href = '/staffhelp';
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const prevMonthDays = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      prevMonthDays.push(daysInPrevMonth - i);
    }
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalCells = prevMonthDays.length + daysInMonth;
    const remainingCells = 42 - totalCells;
    const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => i + 1);
    const allDays = [
      ...prevMonthDays.map(day => ({ day, isCurrentMonth: false, isToday: false })),
      ...currentMonthDays.map(day => ({
        day,
        isCurrentMonth: true,
        isToday: day === currentTime.getDate() &&
          month === currentTime.getMonth() &&
          year === currentTime.getFullYear()
      })),
      ...nextMonthDays.map(day => ({ day, isCurrentMonth: false, isToday: false }))
    ];

    const weeks = [];
    for (let i = 0; i < 6; i++) {
      weeks.push(allDays.slice(i * 7, (i + 1) * 7));
    }

    return weeks;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <img className="sidebar-bg" src="/EIO.jpg" alt="Sidebar Background" />
      <div className="sidebar-overlay"></div>
      <div className="sidebar-content">
        <div className="sidebar-section">
          <div className="section-header">Navigation</div>

          <button 
            className={`sidebar-button`} 
            onClick={handleHomeClick}
          >
            <span className="material-symbols-outlined sidebar-icon">home</span>
            <span>Home</span>
          </button>

          <button
            className={`sidebar-button`}
            onClick={handleClassClick}
          >
            <span className="material-symbols-outlined sidebar-icon">school</span>
            <span>My Classes</span>
            <span className={`material-symbols-outlined dropdown-arrow ${isClassDropdownOpen ? 'open' : ''}`}>
              keyboard_arrow_down
            </span>
          </button>

          {loading ? (
            <div className="loading-message">Loading classes...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className={`classes-dropdown ${isClassDropdownOpen ? 'open' : ''}`}>
              {classes.length > 0 ? (
                classes.map((classItem) => (
                  <button
                    key={classItem._id}
                    className={`sidebar-button class-item`}
                    onClick={() => handleClassItemClick(classItem)}
                  >
                    <div className="course-icon" style={{ background: classItem.color || "#1a73e8" }}>
                      {classItem.name?.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div className="class-info">
                      <div className="class-name">{classItem.name}</div>
                      {classItem.section && (
                        <div className="class-section">Section {classItem.section}</div>
                      )}
                      {classItem.teacher && (
                        <div className="class-staff">Teacher: {classItem.teacher}</div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="no-classes-message">No classes available</div>
              )}
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <div className="section-header">Quick Links</div>
          <button
            className={`sidebar-button `}
            onClick={handleCalendarClick}
          >
            <span className="material-symbols-outlined sidebar-icon">calendar_month</span>
            <span>Calendar</span>
          </button>
          <button
            className={`sidebar-button `}
            onClick={handleHelpClick}
          >
            <span className="material-symbols-outlined sidebar-icon">help</span>
            <span>Help</span>
          </button>

          {showCalendar && (
            <div className="calendar-dropdown">
              <div className="calendar-today">
                <div className="today-date">{formatDate(currentTime)}</div>
                <div className="today-time">{formatTime(currentTime)}</div>
              </div>

              <div className="calendar-header">
                <h3>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
              </div>

              <div className="calendar-weekdays">
                {dayNames.map(day => (
                  <div key={day} className="calendar-weekday">{day}</div>
                ))}
              </div>

              <div className="calendar-days">
                {renderCalendar().map((week, weekIndex) => (
                  <div key={weekIndex} className="calendar-week">
                    {week.map((dayObj, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`calendar-day 
                          ${dayObj.isCurrentMonth ? 'current-month' : 'other-month'}
                          ${dayObj.isToday ? 'today' : ''}
                        `}
                      >
                        {dayObj.day || ''}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffSidebar;