import React from "react";
import {
  FaHome,
  FaUserGraduate,
  FaBook,
  FaChartLine,
  FaUsers,
  FaClipboardList,
  FaSignOutAlt,
} from "react-icons/fa";

function Sidebar({ role, onNavigate, activePage, onLogout }) {
  const buttonStyle = (page) =>
    `btn btn-outline-light mb-3 text-start w-100 ${
      activePage === page ? "bg-light text-dark fw-bold" : ""
    }`;

  return (
    <div
      className="d-flex flex-column p-3 text-white"
      style={{
        width: "230px",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #2a9d8f, #457b9d)",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      <h4 className="text-center mb-4">🎓 Portal</h4>

      {/* STUDENT */}
      {role === "student" && (
        <>
          <button
            className={buttonStyle("dashboard")}
            onClick={() => onNavigate("dashboard")}
          >
            <FaHome className="me-2" /> Dashboard
          </button>
          <button
            className={buttonStyle("profile")}
            onClick={() => onNavigate("profile")}
          >
            <FaUserGraduate className="me-2" /> Profile
          </button>
          <button
            className={buttonStyle("courses")}
            onClick={() => onNavigate("courses")}
          >
            <FaBook className="me-2" /> Courses
          </button>
          <button
            className={buttonStyle("performance")}
            onClick={() => onNavigate("performance")}
          >
            <FaChartLine className="me-2" /> Performance
          </button>
          <button
            className={buttonStyle("achievementsFeed")}
            onClick={() => onNavigate("achievementsFeed")}
          >
            <FaClipboardList className="me-2" /> Achievements Feed
          </button>
          <button
            className={buttonStyle("assignments")}
            onClick={() => onNavigate("assignments")}
          >
            <FaClipboardList className="me-2" /> Assignments
          </button>
          <button
            className={buttonStyle("grades")}
            onClick={() => onNavigate("grades")}
          >
            <FaClipboardList className="me-2" /> Grades
          </button>
        </>
      )}

      {/* LECTURER */}
      {role === "lecturer" && (
        <>
          <button
            className={buttonStyle("dashboard")}
            onClick={() => onNavigate("dashboard")}
          >
            <FaHome className="me-2" /> Dashboard
          </button>
          <button
            className={buttonStyle("manageCourses")}
            onClick={() => onNavigate("manageCourses")}
          >
            <FaBook className="me-2" /> Manage Courses
          </button>
          <button
            className={buttonStyle("assignments")}
            onClick={() => onNavigate("assignments")}
          >
            <FaClipboardList className="me-2" /> Assignments
          </button>
          <button
            className={buttonStyle("performance")}
            onClick={() => onNavigate("performance")}
          >
            <FaChartLine className="me-2" /> Performance
          </button>
        </>
      )}

      {/* ADMIN */}
      {role === "admin" && (
        <>
          <button
            className={buttonStyle("dashboard")}
            onClick={() => onNavigate("dashboard")}
          >
            <FaHome className="me-2" /> Dashboard
          </button>

          <button
            className={buttonStyle("manageUsers")}
            onClick={() => onNavigate("manageUsers")}
          >
            <FaUsers className="me-2" /> Manage Users
          </button>

          <button
            className={buttonStyle("reports")}
            onClick={() => onNavigate("reports")}
          >
            <FaClipboardList className="me-2" /> Reports
          </button>

          <button
            className={buttonStyle("adminProfiles")}
            onClick={() => onNavigate("adminProfiles")}
          >
            <FaUserGraduate className="me-2" /> View Profiles
          </button>

          {/* New GPA/CGPA Calculator button */}
          <button
            className={buttonStyle("gpaAnalyzer")}
            onClick={() => onNavigate("gpaAnalyzer")}
          >
            🎓 Calculate GPA/CGPA
          </button>
        </>
      )}

      {/* LOGOUT */}
      <div className="mt-auto p-3">
        <button 
          className="btn btn-danger w-100 d-flex align-items-center justify-content-center"
          onClick={onLogout}
          style={{
            background: "linear-gradient(45deg, #ff6b6b, #ee5a24)",
            border: "none",
            padding: "10px"
          }}
        >
          <FaSignOutAlt className="me-2" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;