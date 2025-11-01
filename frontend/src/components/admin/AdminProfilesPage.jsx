import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

function AdminProfilesPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      try {
        // Fetch students
        const studentsResponse = await fetch(
          "http://127.0.0.1:8000/api/accounts/all-users/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          setUsers(studentsData);
        } else {
          console.log("Using mock data");
          // Mock data if API fails
          setUsers([
            {
              id: 1,
              username: "john_doe",
              email: "john@example.com",
              role: "student",
              department: "Computer Science",
              year: "3rd Year",
              bio: "Passionate about software development",
            },
            {
              id: 2,
              username: "mary_jane",
              email: "mary@example.com",
              role: "student",
              department: "Software Engineering",
              year: "4th Year",
              bio: "AI enthusiast and hackathon winner",
            },
            {
              id: 3,
              username: "peter_parker",
              email: "peter@example.com",
              role: "student",
              department: "Information Technology",
              year: "2nd Year",
              bio: "Cybersecurity researcher",
            },
            {
              id: 4,
              username: "dr_smith",
              email: "smith@example.com",
              role: "lecturer",
              department: "Computer Science",
              bio: "Professor of Algorithms and Data Structures",
            },
            {
              id: 5,
              username: "prof_johnson",
              email: "johnson@example.com",
              role: "lecturer",
              department: "Software Engineering",
              bio: "Senior Lecturer in Machine Learning",
            },
            {
              id: 6,
              username: "admin_user",
              email: "admin@example.com",
              role: "admin",
              department: "Administration",
              bio: "System Administrator",
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        // Use mock data on error
        setUsers([
          {
            id: 1,
            username: "john_doe",
            email: "john@example.com",
            role: "student",
            department: "Computer Science",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search and active tab
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.department &&
        user.department.toLowerCase().includes(search.toLowerCase()));

    const matchesTab =
      activeTab === "all" ||
      user.role === activeTab;

    return matchesSearch && matchesTab;
  });

  // Count users by role
  const counts = {
    all: users.length,
    student: users.filter((u) => u.role === "student").length,
    lecturer: users.filter((u) => u.role === "lecturer").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "student":
        return "bg-primary";
      case "lecturer":
        return "bg-success";
      case "admin":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  return (
    <motion.div
      className="card shadow p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>👥 User Profiles Management</h4>
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: "300px" }}
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div
            className="card text-center p-3"
            style={{ backgroundColor: "#e7f3ff" }}
          >
            <h6 className="text-muted mb-1">Total Users</h6>
            <h3 className="mb-0">{counts.all}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div
            className="card text-center p-3"
            style={{ backgroundColor: "#caffbf" }}
          >
            <h6 className="text-muted mb-1">Students</h6>
            <h3 className="mb-0">{counts.student}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div
            className="card text-center p-3"
            style={{ backgroundColor: "#9bf6ff" }}
          >
            <h6 className="text-muted mb-1">Lecturers</h6>
            <h3 className="mb-0">{counts.lecturer}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div
            className="card text-center p-3"
            style={{ backgroundColor: "#ffd6a5" }}
          >
            <h6 className="text-muted mb-1">Admins</h6>
            <h3 className="mb-0">{counts.admin}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Users ({counts.all})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "student" ? "active" : ""}`}
            onClick={() => setActiveTab("student")}
          >
            Students ({counts.student})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "lecturer" ? "active" : ""}`}
            onClick={() => setActiveTab("lecturer")}
          >
            Lecturers ({counts.lecturer})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            Admins ({counts.admin})
          </button>
        </li>
      </ul>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{user.username}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`badge ${getRoleBadgeClass(
                          user.role
                        )} text-uppercase`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>{user.department || "N/A"}</td>
                    <td>{user.year || "N/A"}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => viewUserDetails(user)}
                      >
                        👁️ View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No users found matching your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) =>
            e.target.className.includes("modal fade") && setShowModal(false)
          }
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  👤 User Profile: {selectedUser.username}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <strong>Username:</strong>
                    <p className="text-muted">{selectedUser.username}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Email:</strong>
                    <p className="text-muted">{selectedUser.email}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Role:</strong>
                    <p>
                      <span
                        className={`badge ${getRoleBadgeClass(
                          selectedUser.role
                        )} text-uppercase`}
                      >
                        {selectedUser.role}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Department:</strong>
                    <p className="text-muted">
                      {selectedUser.department || "N/A"}
                    </p>
                  </div>
                  {selectedUser.year && (
                    <div className="col-md-6 mb-3">
                      <strong>Year:</strong>
                      <p className="text-muted">{selectedUser.year}</p>
                    </div>
                  )}
                  {selectedUser.bio && (
                    <div className="col-12 mb-3">
                      <strong>Bio:</strong>
                      <p className="text-muted">{selectedUser.bio}</p>
                    </div>
                  )}
                </div>

                {selectedUser.role === "student" && (
                  <div className="alert alert-info">
                    <strong>📊 Academic Info:</strong> View detailed academic
                    records in the Reports section.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default AdminProfilesPage;