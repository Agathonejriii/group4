import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

function ProfilePage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    year: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);

  // Fetch logged-in user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const response = await fetch("http://127.0.0.1:8000/api/accounts/me/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch user");

        const data = await response.json();
        setFormData({
          name: data.username || "",
          email: data.email || "",
          department: data.department || "Computer Science",
          year: data.year || "Year 3",
          bio: data.bio || "",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        alert("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return alert("You are not logged in!");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/accounts/me/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save profile");

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile.");
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-4">
        <div className="spinner-border text-primary" role="status"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 shadow"
      style={{ maxWidth: "700px", margin: "0 auto", borderRadius: "15px" }}
    >
      <h4 className="text-center mb-4 text-primary">Edit Profile</h4>

      <div className="mb-3">
        <label className="form-label">Full Name</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="form-control"
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Email</label>
        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="form-control"
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Department</label>
        <input
          name="department"
          value={formData.department}
          onChange={handleChange}
          className="form-control"
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Year</label>
        <input
          name="year"
          value={formData.year}
          onChange={handleChange}
          className="form-control"
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          className="form-control"
          rows="3"
        />
      </div>

      <button className="btn btn-primary w-100" onClick={handleSave}>
        Save Changes
      </button>
    </motion.div>
  );
}

export default ProfilePage;
