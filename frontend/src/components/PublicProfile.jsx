import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";

function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        const res = await fetch(`/api/achievements/${username}/public/`);
        const data = await res.json();
        setAchievements(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicProfile();
  }, [username]);

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary"></div>
        <p>Loading profile...</p>
      </div>
    );

  return (
    <div
      className="container mt-5 p-4"
      style={{
        maxWidth: "850px",
        background: "linear-gradient(to right, #e8f9fd, #ffffff)",
        borderRadius: "15px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <img
          src={`https://ui-avatars.com/api/?name=${username}&background=007bff&color=fff`}
          alt="avatar"
          className="rounded-circle mb-3"
          width={100}
          height={100}
        />
        <h3>@{username}</h3>
        <p className="text-muted">
          Welcome to {username}'s public portfolio 🎓
        </p>
      </motion.div>

      <motion.div
        className="card shadow p-3 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h5 className="mb-3 text-primary">🏆 Public Achievements</h5>
        {achievements.length > 0 ? (
          achievements.map((a, i) => (
            <div key={i} className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <strong>{a.title}</strong>
                <span className="badge bg-success">Public</span>
              </div>
              <div className="progress mt-1">
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${a.progress || 100}%` }}
                ></div>
              </div>
              {a.description && (
                <p className="mt-2 text-muted">{a.description}</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-muted text-center">No public achievements yet.</p>
        )}
      </motion.div>

      <footer className="text-center text-muted mt-4">
        <small>Powered by Makerere Student Dashboard © 2025</small>
      </footer>
    </div>
  );
}

export default PublicProfile;
