import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import "./Sidebar.css";

const Sidebar = ({ isOpen, userRole = "student" }) => {
  const [classes, setClasses] = useState([]);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studentId, setStudentId] = useState(null);
  const [studentEmail, setStudentEmail] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed - user:', user);
      if (user) {
        setStudentId(user.uid);
        setStudentEmail(user.email || null);
        if (user.email) {
          fetchStudentClasses(user.uid, user.email);
        } else {
          console.error('No email found for user:', user.uid);
          setError('Please update your email in your profile to view classes.');
          setClasses([]);
          setLoading(false);
        }
      } else {
        console.log('No user logged in');
        setStudentId(null);
        setStudentEmail(null);
        setClasses([]);
        navigate("/login");
      }
    });

    if (!document.getElementById("material-symbols-font")) {
      const link = document.createElement("link");
      link.id = "material-symbols-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0";
      document.head.appendChild(link);
    }

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (studentId && studentEmail) {
      const interval = setInterval(() => {
        console.log('Polling classes for studentId:', studentId, 'email:', studentEmail);
        fetchStudentClasses(studentId, studentEmail);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [studentId, studentEmail]);

  const fetchStudentClasses = async (uid, email) => {
    setLoading(true);
    try {
      console.log('Fetching classes for studentId:', uid, 'email:', email);
      if (!email) {
        throw new Error('User email not found');
      }
      const response = await fetch(`https://lms-iap4.onrender.com/api/classes/student/${uid}?email=${encodeURIComponent(email)}`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Fetched classes data:', data);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${data.error || 'Unknown error'}`);
      }
      setClasses(Array.isArray(data.classes) ? data.classes : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching classes:', error.message);
      setError('Failed to load classes. Please ensure your email is set in your profile.');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

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
    setActiveItem("home");
    setIsClassDropdownOpen(false);
    setShowCalendar(false);
    navigate("/home");
  };

  const handleClassClick = () => {
    setActiveItem("classes");
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
    console.log('Navigating to:', `/stream/${classObj._id}`);
    navigate(`/stream/${classObj._id}`);
  };

  const handleCalendarClick = () => {
    setActiveItem("calendar");
    setShowCalendar(!showCalendar);
    setIsClassDropdownOpen(false);
  };

  const handleHelpClick = () => {
    setActiveItem("help");
    setShowCalendar(false);
    setIsClassDropdownOpen(false);
    navigate("/help");
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
      ...prevMonthDays.map((day) => ({ day, isCurrentMonth: false, isToday: false })),
      ...currentMonthDays.map((day) => ({
        day,
        isCurrentMonth: true,
        isToday:
          day === currentTime.getDate() &&
          month === currentTime.getMonth() &&
          year === currentTime.getFullYear(),
      })),
      ...nextMonthDays.map((day) => ({ day, isCurrentMonth: false, isToday: false })),
    ];

    const weeks = [];
    for (let i = 0; i < 6; i++) {
      weeks.push(allDays.slice(i * 7, (i + 1) * 7));
    }

    return weeks;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date) => {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .filter((part) => part.length > 0)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <img className="sidebar-bg" src="/EIO.jpg" alt="Sidebar Background" />
      <div className="sidebar-overlay"></div>
      <div className="sidebar-content"></div>
      <div className="sidebar-section">
        <div className="section-header">Navigation</div>
        <button
          className={`sidebar-button ${activeItem === "home" ? "active" : ""}`}
          onClick={handleHomeClick}
        >
          <span className="material-symbols-outlined sidebar-icon">home</span>
          <span>Home</span>
        </button>
        <button
          className={`sidebar-button ${activeItem === "classes" ? "active" : ""}`}
          onClick={handleClassClick}
        >
          <span className="material-symbols-outlined sidebar-icon">school</span>
          <span>Classes</span>
          <span
            className={`material-symbols-outlined dropdown-arrow ${
              isClassDropdownOpen ? "open" : ""
            }`}
          >
            keyboard_arrow_down
          </span>
        </button>
        {loading ? (
          <div className="loading-message">Loading classes...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className={`classes-dropdown ${isClassDropdownOpen ? "open" : ""}`}>
            {classes.length > 0 ? (
              classes.map((classItem) => (
                <button
                  key={classItem._id}
                  className={`sidebar-button class-item ${
                    activeItem === `class-${classItem._id}` ? "active" : ""
                  }`}
                  onClick={() => handleClassItemClick(classItem)}
                >
                  <div
                    className="course-icon"
                    style={{ background: classItem.color || "#1a73e8" }}
                  >
                    {getInitials(classItem.name)}
                  </div>
                  <div className="class-info">
                    <div className="class-name">{classItem.name}</div>
                    <div className="class-section">
                      {classItem.section && `Section ${classItem.section}`}
                    </div>
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
          className={`sidebar-button ${activeItem === "calendar" ? "active" : ""}`}
          onClick={handleCalendarClick}
        >
          <span className="material-symbols-outlined sidebar-icon">calendar_month</span>
          <span>Calendar</span>
        </button>
        <button
          className={`sidebar-button ${activeItem === "help" ? "active" : ""}`}
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
              <h3>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
            </div>

            <div className="calendar-weekdays">
              {dayNames.map((day) => (
                <div key={day} className="calendar-weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-days">
              {renderCalendar().map((week, weekIndex) => (
                <div key={weekIndex} className="calendar-week">
                  {week.map((dayObj, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`calendar-day 
                        ${dayObj.isCurrentMonth ? "current-month" : "other-month"}
                        ${dayObj.isToday ? "today" : ""}`}
                    >
                      {dayObj.day || ""}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
  );
};

export default Sidebar;