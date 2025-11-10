import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { loginUser } from "../api/config";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginUser(username, password);
      // Save user info in localStorage
      const userInfo = {
        username: response.username,
        email: response.email,
        role: response.role,
      };
      localStorage.setItem("user", JSON.stringify(userInfo));
      console.log("✅ Login successful!", userInfo);
      navigate("/dashboard"); // Redirect after login
    } catch (err) {
      console.error("❌ Login error:", err);
      // Handle different error types
      if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
        setError("Cannot connect to server. Please ensure the backend is running.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }; // ✅ Added missing closing brace and semicolon

  const handleRegisterClick = () => navigate("/register");

  return (
    <div className="login-page">
      {/* Left Branding Sidebar */}
      <div className="login-sidebar">
        <div className="logo">
          <img src="/logo.png" alt="University Logo" />
        </div>
        <h2>Welcome to Your University Portal</h2>
        <p>Access your courses, grades, and more securely.</p>
      </div>

      {/* Right Login Form */}
      <div className="login-container">
        <h3>Login</h3>
        <p>Please enter your university credentials to continue.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <p className="text-danger">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="login-footer">
          <p className="footer-links">
            Forgot your password? <a href="#">Reset here</a> |{" "}
            <span className="register-link" onClick={handleRegisterClick}>
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;