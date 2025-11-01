import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function Home() {
  const [selectedRole, setSelectedRole] = useState("student");

  const roleMessages = {
    student: "Access your classes, grades, and assignments.",
    lecturer: "Manage your courses and student performance.",
    admin: "Oversee portal activities and user management.",
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{
        //background: "linear-gradient(135deg, #a8dadc, #457b9d)",
        color: "#1d3557",
        padding: "20px",
      }}
    >
      <motion.div
        className="card shadow-lg text-center p-4 p-md-5"
        style={{
          maxWidth: "750px",
          marginLeft: "230px",
          width: "100%",
          backgroundColor: "#f1faee",
          borderRadius: "20px",
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          className="fw-bold mb-3"
          style={{ color: "#1d3557" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🎓 University Portal
        </motion.h1>
        <motion.p
          className="text-muted mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Select your role and proceed to login or register.
        </motion.p>

        {/* Role Selector */}
        <div className="d-flex justify-content-center flex-wrap mb-4 gap-3">
          {["student", "lecturer", "admin"].map((role) => (
            <motion.div
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`role-card p-3 rounded text-capitalize ${
                selectedRole === role ? "active-role" : ""
              }`}
              style={{
                cursor: "pointer",
                backgroundColor:
                  selectedRole === role ? "#2f4a70ff" : "#e9ecef",
                color: selectedRole === role ? "#fff" : "#1d3557",
                minWidth: "120px",
                fontWeight: 500,
              }}
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {role}
            </motion.div>
          ))}
        </div>

        {/* Dynamic Info Section */}
        <motion.div
          className="p-3 mb-4 rounded"
          style={{
            backgroundColor: "#a8dadc",
            color: "#1d3557",
            fontSize: "1rem",
            fontWeight: 500,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={selectedRole}
        >
          {roleMessages[selectedRole]}
        </motion.div>

        {/* Action Buttons */}
        <div className="d-flex flex-column flex-md-row justify-content-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link
              to="/login"
              className="btn btn-primary px-4 py-2"
              style={{
                backgroundColor: "#3f74beff",
                marginRight: "100px",
                border: "none",
                borderRadius: "10px",
              }}
            >
              Login
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link
              to="/register"
              className="btn btn-success px-4 py-2"
              style={{
                backgroundColor: "#2a9d8f",
                border: "none",
                borderRadius: "10px",
              }}
            >
              Register
            </Link>
          </motion.div>
        </div>

        {/* Footer Section */}
        <motion.p
          className="mt-4 small text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          © 2025 University Portal — All Rights Reserved
        </motion.p>
      </motion.div>
    </div>
  );
}

export default Home;
