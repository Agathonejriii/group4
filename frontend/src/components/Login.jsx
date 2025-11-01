import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

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
      const response = await fetch("http://127.0.0.1:8000/api/accounts/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      // Debug: Check response
      console.log("Login response:", data);

      if (!response.ok) {
        setError(
          data.detail || 
          data.non_field_errors?.[0] || 
          "Invalid username or password"
        );
      } else {
        // Save JWT tokens
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);
        
        // Save user info including role
        localStorage.setItem("user", JSON.stringify({
          username: data.username,
          email: data.email,
          role: data.role
        }));
        
        console.log("Login successful! Stored tokens and user data.");
        
        // Navigate to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

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
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
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