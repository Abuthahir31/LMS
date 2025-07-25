import React, { useState, useRef, useEffect } from "react";
import "./Navbar.css";
import { auth } from "./firebase";
import {
  signOut,
  signInWithEmailAndPassword,
  updatePassword,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaLock, FaUser } from "react-icons/fa";

const StuNavbar = ({ toggleSidebar, refreshClasses }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  //const [joinModal, setJoinModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const dropdownRef = useRef();
  const profileDropdownRef = useRef();
  const joinModalRef = useRef();
  const resetPasswordModalRef = useRef();
  const navigate = useNavigate();
  const isLoggingOut = useRef(false); // Prevent duplicate logout calls

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
        // Use sendBeacon for reliable logging during tab/browser close
        const beaconSent = navigator.sendBeacon("https://lms-iap4.onrender.com/api/activity/log", data);
        if (!beaconSent) {
          // Fallback to fetch if sendBeacon fails
          await fetch("https://lms-iap4.onrender.com/api/activity/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: data,
          });
        }
      } else {
        // Use fetch for regular requests
        const response = await fetch("https://lms-iap4.onrender.com/api/activity/log", {
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
        // Set session flag to indicate active session
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
      } else if (!isResettingPassword) {
        setUserData(null);
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [isResettingPassword, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isLoggingOut.current) return; // Prevent duplicate logout
      const user = auth.currentUser;
      if (user && document.visibilityState === "hidden") {
        // Tab or browser is closing, mark session as closing
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
            // Log logout first to ensure backend receives it
            await logActivity(user.uid, user.email, "logout", true); // Use sendBeacon
            await signOut(auth); // Sign out after logging
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

  // const openJoinModal = () => {
  //   setJoinModal(true);
  //   setError("");
  //   setSuccessMessage("");
  // };

  const openResetPasswordModal = () => {
    setResetPasswordModal(true);
    setError("");
    setSuccessMessage("");
    setEmail("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const closeModal = (setter) => {
    setter(false);
    setError("");
    setSuccessMessage("");
    setClassCode("");
    setEmail("");
  };

  const handleLogout = async () => {
    if (isLoggingOut.current) return; // Prevent duplicate logout
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

  // const handleJoinClass = async () => {
  //   if (!classCode.trim()) {
  //     setError("Class code is required");
  //     return;
  //   }

  //   try {
  //     const user = auth.currentUser;
  //     if (!user) throw new Error("User not authenticated");

  //     const response = await fetch("https://lms-iap4.onrender.com/api/classes/join", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         classCode,
  //         studentId: user.uid,
  //         email: user.email,
  //       }),
  //     });

  //     const data = await response.json();
  //     if (!response.ok) {
  //       if (data.message === "Student already joined this class") {
  //         setSuccessMessage("You have already joined this class");
  //         setClassCode("");
  //         return;
  //       }
  //       throw new Error(data.error || "Failed to join class");
  //     }

  //     setSuccessMessage("Successfully joined the class!");
  //     refreshClasses();
  //     setClassCode("");
  //     setTimeout(() => closeModal(setJoinModal), 2000);
  //   } catch (error) {
  //     console.error("Error joining class:", error);
  //     setError(error.message || "Error joining class");
  //   }
  // };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");
    setIsResettingPassword(true);

    if (!email.endsWith("@gmail.com")) {
      setError("Please use a valid Gmail address");
      setLoading(false);
      setIsResettingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      setLoading(false);
      setIsResettingPassword(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New password and confirm password do not match");
      setLoading(false);
      setIsResettingPassword(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, currentPassword);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        setError("Please verify your email address first.");
        setLoading(false);
        setIsResettingPassword(false);
        return;
      }

      await updatePassword(user, newPassword);
      await logActivity(user.uid, user.email, "password_reset");
      await signOut(auth);
      sessionStorage.removeItem(`sessionActive_${user.uid}`);
      setSuccessMessage("Password reset successfully! Please sign in with your new password.");
      setEmail("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      closeModal(setResetPasswordModal);
      navigate("/");
    } catch (err) {
      console.error("Password reset error:", err.code, err.message);
      if (err.code === "auth/wrong-password") {
        setError("Incorrect current password");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak (min 6 chars)");
      } else if (err.code === "auth/invalid-credential") {
        setError("Invalid credentials provided");
      } else if (err.code === "auth/invalid-api-key") {
        setError("Invalid API key. Please check your Firebase configuration.");
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setIsResettingPassword(false);
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
      // if (joinModal && joinModalRef.current && e.target === joinModalRef.current) {
      //   closeModal(setJoinModal);
      // }
      if (
        resetPasswordModal &&
        resetPasswordModalRef.current &&
        e.target === resetPasswordModalRef.current
      ) {
        closeModal(setResetPasswordModal);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen, profileDropdownOpen, resetPasswordModal]);

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
              {/* <div className="plus-btn" onClick={toggleDropdown} aria-label="Open Actions Menu">
                <span className="material-symbols-outlined">group_add</span>
              </div> */}
              <div className="dropdown-content">
                {/* <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setDropdownOpen(false);
                    //openJoinModal();
                  }}
                >
                  <span className="material-symbols-outlined">group_add</span>
                  Join class
                </a> */}
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
                        openResetPasswordModal();
                      }}
                    >
                      <span className="material-symbols-outlined">lock_reset</span>
                      Reset Password
                    </a>
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

      {/* {joinModal && (
        <div className="modal show" ref={joinModalRef}>
          <div className="modal-content">
            <span onClick={() => closeModal(setJoinModal)} className="close" aria-label="Close Modal">
              ×
            </span>
            <div className="modal-header">
              <h2>Join class</h2>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              {successMessage && (
                <div className="success-message">
                  <span className="material-symbols-outlined">check_circle</span>
                  {successMessage}
                </div>
              )}
              {!successMessage && (
                <div className="form-group">
                  <label>Class code (required)</label>
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    placeholder="Enter class code"
                    required
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => closeModal(setJoinModal)}>
                Cancel
              </button>
              {!successMessage && (
                <button
                  className="btn btn-create"
                  onClick={handleJoinClass}
                  disabled={!classCode.trim()}
                >
                  Join
                </button>
              )}
            </div>
          </div>
        </div>
      )} */}

      {resetPasswordModal && (
        <div className="modal show" ref={resetPasswordModalRef}>
          <div className="modal-content">
            <span
              onClick={() => closeModal(setResetPasswordModal)}
              className="close"
              aria-label="Close Modal"
            >
              ×
            </span>
            <div className="modal-header">
              <h2>Reset Password</h2>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
              <div className="form-group">
                <label>Your Gmail Address (required)</label>
                <div className="input-with-icon">
                  <FaUser className="input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your Gmail address"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Current Password (required)</label>
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>New Password (required, min 6 chars)</label>
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Confirm New Password (required)</label>
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancel"
                onClick={() => closeModal(setResetPasswordModal)}
              >
                Cancel
              </button>
              <button
                className="btn btn-create"
                onClick={handleResetPassword}
                disabled={
                  loading ||
                  !email.trim() ||
                  !currentPassword.trim() ||
                  !newPassword.trim() ||
                  !confirmNewPassword.trim()
                }
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StuNavbar;