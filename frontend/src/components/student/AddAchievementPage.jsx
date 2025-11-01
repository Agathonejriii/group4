import React, { useState } from "react";
import { motion } from "framer-motion";

function AddAchievementPage({ onBack, onSave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const [evidence, setEvidence] = useState(null);

  const handleFileChange = (e) => {
    setEvidence(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Please enter a title");

    const newAchievement = {
      title,
      description,
      progress,
      isPublic,
      evidenceName: evidence ? evidence.name : null,
    };

    alert("Achievement saved successfully (mock API)");
    onSave(newAchievement);
    onBack();
  };

  return (
    <motion.div
      className="card shadow p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{marginLeft:"-700px"}}
    >
      <h4 className="mb-3">➕ Add New Achievement</h4>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-bold">Title</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. UI Design Challenge"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Description</label>
          <textarea
            className="form-control"
            placeholder="Briefly describe your achievement..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Progress: {progress}%</label>
          <input
            type="range"
            className="form-range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Visibility</label>
          <select
            className="form-select"
            value={isPublic ? "public" : "private"}
            onChange={(e) => setIsPublic(e.target.value === "public")}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Upload Evidence</label>
          <input type="file" className="form-control" onChange={handleFileChange} />
          {evidence && (
            <div className="mt-2 alert alert-info p-2">
              Uploaded: {evidence.name}
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between">
          <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
            ← Back
          </button>
          <button type="submit" className="btn btn-success">
            Save Achievement
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export default AddAchievementPage;
