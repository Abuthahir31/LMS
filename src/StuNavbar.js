import React, { useState, useRef, useEffect } from "react";
import "./Navbar.css";
import { auth } from "./firebase";
import { signOut, setPersistence, browserSessionPersistence } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const StuNavbar = ({ toggleSidebar, refreshClasses }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef();
  const profileDropdownRef = useRef();
  const navigate = useNavigate();
  const isLoggingOut = useRef(false);

  useEffect(() => {
    const setAuthPersistence = async () => {
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (err) {
        console.error("Failed to set session persistence:", err);
      }
    };
    setAuthPersistence();
  }, []);

  const logActivity = async (userId, email, type, useBeacon = false) => {
    try {
      const data = JSON.stringify({ userId, email, type });
      if (useBeacon) {
        const beaconSent = navigator.sendBeacon("https://uelms.onrender.com/api/activity/log", data);
        if (!beaconSent) {
          await fetch("https://uelms.onrender.com/api/activity/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: data,
          });
        }
      } else {
        const response = await fetch("https://uelms.onrender.com/api/activity/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: data,
        });
        if (!response.ok) {
          throw new Error("Failed to log activity");
        }
      }
    } catch (err) {
      console.error(`Failed to log ${type} activity:`, err);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        sessionStorage.setItem(`sessionActive_${user.uid}`, "true");
        await logActivity(user.uid, user.email, "login");
        const displayName = user.displayName || user.email.split("@")[0];
        const firstLetter = user.email.charAt(0).toUpperCase();
        setUserData({
          email: user.email,
          photoURL:
            user.photoURL ||
            `https://ui-avatars.com/api/?name=${firstLetter}&background=random&color=fff`,
          displayName: displayName,
          shortEmail:
            user.email.length > 20
              ? `${user.email.substring(0, 15)}...@${user.email.split("@")[1]}`
              : user.email,
          uid: user.uid,
        });
      } else {
        setUserData(null);
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isLoggingOut.current) return;
      const user = auth.currentUser;
      if (user && document.visibilityState === "hidden") {
        sessionStorage.setItem(`sessionActive_${user.uid}`, "closing");
      }
    };

    const handleVisibilityChange = async () => {
      const user = auth.currentUser;
      if (user && document.visibilityState === "hidden") {
        const sessionKey = `sessionActive_${user.uid}`;
        if (sessionStorage.getItem(sessionKey) === "closing") {
          isLoggingOut.current = true;
          try {
            await logActivity(user.uid, user.email, "logout", true);
            await signOut(auth);
            sessionStorage.removeItem(sessionKey);
          } catch (err) {
            console.error("Error logging out on tab close:", err);
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen((v) => !v);
  };

  const toggleProfileDropdown = (e) => {
    e.stopPropagation();
    setProfileDropdownOpen((v) => !v);
  };

  const closeModal = (setter) => {
    setter(false);
    setError("");
    setSuccessMessage("");
    setClassCode("");
  };

  const handleLogout = async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    try {
      const user = auth.currentUser;
      if (user) {
        await logActivity(user.uid, user.email, "logout");
        sessionStorage.removeItem(`sessionActive_${user.uid}`);
      }
      await signOut(auth);
      setUserData(null);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to logout. Please try again.");
    } finally {
      isLoggingOut.current = false;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown") && dropdownOpen) {
        setDropdownOpen(false);
      }
      if (!e.target.closest(".profile-dropdown") && profileDropdownOpen) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen, profileDropdownOpen]);

  return (
    <>
      <div className="navbar-container">
        <nav>
          <div className="nav-left">
            <a href="#" onClick={toggleSidebar} aria-label="Toggle Sidebar">
              <span className="material-symbols-outlined">menu</span>
            </a>
            <span>
              <img className="logo" src="/logo1.jpg" alt="Logo" />
            </span>
          </div>
          <div className="nav-center">
            <h1>LEARNING MANAGEMENT SYSTEM</h1>
          </div>
          <div className="nav-right">
            <div className={`dropdown${dropdownOpen ? " show" : ""}`} ref={dropdownRef}>
              <div className="dropdown-content">
              </div>
            </div>

            <div
              className={`profile-dropdown${profileDropdownOpen ? " show" : ""}`}
              ref={profileDropdownRef}
            >
              <div
                className="profile-btn"
                onClick={toggleProfileDropdown}
                aria-label="Open Profile Menu"
              >
                {userData && (
                  <img
                    src={userData.photoURL}
                    alt="Profile"
                    className="profile-pic"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${userData.email.charAt(
                        0
                      )}&background=random&color=fff`;
                    }}
                  />
                )}
              </div>
              <div className="profile-dropdown-content">
                {userData && (
                  <>
                    <div className="profile-info">
                      <span className="profile-name">{userData.displayName}</span>
                      <span className="profile-email" title={userData.email}>
                        {userData.email}
                      </span>
                    </div>
                    <div className="dropdown-divider"></div>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                    >
                      <span className="material-symbols-outlined">logout</span>
                      Logout
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default StuNavbar;