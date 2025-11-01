import React from "react";

function Header({ user }) {
  return (
    <div
      className="d-flex justify-content-between align-items-center px-4 py-3 shadow-sm"
      style={{
        backgroundColor: "#e0f2f1",
        borderBottom: "2px solid #a8dadc",
        marginLeft: "230px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <h4 style={{ color: "#1d3557" }}>Welcome, {user.name}</h4>
      <div className="d-flex align-items-center">
        <img
          src="https://via.placeholder.com/40"
          alt="profile"
          className="rounded-circle me-2"
        />
        <span style={{ color: "#1d3557", fontWeight: "500" }}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)} {/* Capitalize role */}
        </span>
      </div>
    </div>
  );
}

export default Header;
