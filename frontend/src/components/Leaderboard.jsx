import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const Leaderboard = ({ currentUser }) => {
  // Dummy student data
  const [students, setStudents] = useState([
    { name: "Alice", cgpa: 4.0, achievements: 10 },
    { name: "Bob", cgpa: 3.9, achievements: 8 },
    { name: "Charlie", cgpa: 3.8, achievements: 12 },
    { name: "John Doe", cgpa: 3.85, achievements: 9 },
    { name: "Eve", cgpa: 3.7, achievements: 5 },
  ]);

  const [topN, setTopN] = useState(3); // Show top N students

  // Sort by CGPA descending
  const sortedStudents = [...students].sort((a, b) => b.cgpa - a.cgpa);

  // Find current user rank
  const userRank =
    sortedStudents.findIndex((s) => s.name === currentUser.name) + 1;

  return (
    <motion.div
      className="card shadow mb-4 p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h5 className="mb-3 text-primary">🏆 Leaderboard</h5>

      <table className="table table-striped mb-3">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>CGPA</th>
            <th>Achievements</th>
          </tr>
        </thead>
        <tbody>
          {sortedStudents.slice(0, topN).map((s, idx) => (
            <tr
              key={idx}
              className={s.name === currentUser.name ? "table-success" : ""}
            >
              <td>{idx + 1}</td>
              <td>{s.name}</td>
              <td>{s.cgpa.toFixed(2)}</td>
              <td>{s.achievements}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-center">
        <small>
          Your Rank: {userRank} | Achievements:{" "}
          {students.find((s) => s.name === currentUser.name)?.achievements || 0}
        </small>
      </div>

      <div className="mt-3">
        <label>
          Show Top{" "}
          <input
            type="number"
            value={topN}
            min={1}
            max={students.length}
            onChange={(e) => setTopN(Number(e.target.value))}
            style={{ width: "60px" }}
          />{" "}
          students
        </label>
      </div>
    </motion.div>
  );
};

export default Leaderboard;
