import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";
import Leaderboard from "./Leaderboard";
import ProfilePage from "./student/ProfilePage";
import AddAchievementPage from "./student/AddAchievementPage";
import AchievementsFeedPage from "./student/AchievementsFeedPage";
import AdminProfilesPage from "./admin/AdminProfilesPage";
import AdminGPAAnalyzer from "./admin/AdminGPAAnalyzer";
import AdminReportsPage from "./admin/AdminReportsPage";
import StudentReportsPage from './student/StudentReportsPage';

// ===== GPA / CGPA computation helpers =====
const computeSemesterGPA = (courses) => {
  if (!courses.length) return 0;
  const totalPoints = courses.reduce((acc, c) => acc + c.grade * c.credits, 0);
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  return (totalPoints / totalCredits).toFixed(2);
};

const computeCGPA = (semesters) => {
  if (!semesters.length) return 0;
  const totalPoints = semesters.reduce(
    (acc, sem) => acc + sem.courses.reduce((sum, c) => sum + c.grade * c.credits, 0),
    0
  );
  const totalCredits = semesters.reduce(
    (acc, sem) => acc + sem.courses.reduce((sum, c) => sum + c.credits, 0),
    0
  );
  return (totalPoints / totalCredits).toFixed(2);
};

// Overview Content Component for Student Dashboard
const OverviewContent = ({ user, achievements, skills, projects, awards }) => {
  return (
    <div>
      {/* Quick Stats */}
      <div className="row mb-4">
        <DashboardCard title="Achievements" value={achievements.length} icon="🎯" color="#caffbf" />
        <DashboardCard title="Projects" value={projects.length} icon="📁" color="#9bf6ff" />
        <DashboardCard title="Skills" value={skills.length} icon="💡" color="#ffd6a5" />
        <DashboardCard title="Awards" value={awards.length} icon="🏆" color="#ffadad" />
      </div>

      {/* Recent Activity */}
      <motion.div 
        className="card shadow mb-4 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h5 className="mb-3">📈 Recent Activity</h5>
        <div className="row">
          <div className="col-md-6">
            <h6>Recent Achievements</h6>
            <ul className="list-group">
              {achievements.slice(0, 3).map((achievement, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  {achievement.title}
                  <span className={`badge ${achievement.isPublic ? 'bg-success' : 'bg-secondary'}`}>
                    {achievement.progress}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-md-6">
            <h6>Quick Actions</h6>
            <div className="d-grid gap-2">
              <button className="btn btn-outline-primary btn-sm" onClick={() => window.location.href = '#achievements'}>
                ➕ Add New Achievement
              </button>
              <button className="btn btn-outline-info btn-sm" onClick={() => window.location.href = '#reports'}>
                📊 Generate Report
              </button>
              <button className="btn btn-outline-success btn-sm" onClick={() => window.location.href = '#achievements-feed'}>
                👥 View Peer Feed
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <Leaderboard currentUser={user} />
    </div>
  );
};

// Student Dashboard Component with Tabs
// Student Dashboard Component with Tabs
const StudentDashboard = ({ user, achievements, setActivePage }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div>
      {/* Enhanced Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="card shadow border-0 bg-primary text-white">
          <div className="card-body py-4">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h3 className="mb-2">🎓 Hello, {user.username}!</h3>
                <p className="mb-0 opacity-75">
                  Welcome to your student dashboard. Track your progress, generate reports, and connect with peers.
                </p>
              </div>
              <div className="col-md-4 text-end">
                <div className="bg-white bg-opacity-20 rounded p-3 d-inline-block">
                  <small className="d-block opacity-75">Your Role</small>
                  <strong className="fs-5">{user.role.toUpperCase()}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="card shadow-sm mb-4">
        <div className="card-body py-3">
          <ul className="nav nav-tabs border-0">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} 
                      onClick={() => setActiveTab('overview')}>
                📊 Overview
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`} 
                      onClick={() => setActiveTab('reports')}>
                📋 Reports Center
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'achievements' ? 'active' : ''}`} 
                      onClick={() => setActiveTab('achievements')}>
                🏆 Peer Achievements
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewContent 
          user={user}
          achievements={achievements}
          skills={["React JS", "UI Design"]}
          projects={["Portfolio Website"]}
          awards={["Best Team Player 2024"]}
        />
      )}
      {activeTab === 'reports' && <StudentReportsPage />}
      {activeTab === 'achievements' && <AchievementsFeedPage currentUser={user} />}
    </div>
  );
};

function Dashboard() {
  const navigate = useNavigate();
  
  // ==================== STATE ====================
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");

  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const [newCourse, setNewCourse] = useState("");
  const [newAssignment, setNewAssignment] = useState("");
  const [newUser, setNewUser] = useState("");

  const [courses, setCourses] = useState(["Web Development", "React JS"]);
  const [assignments, setAssignments] = useState([
    "JavaScript Challenge",
    "Node.js Basics",
  ]);
  const [users, setUsers] = useState([
    "John Doe (Student)",
    "Jane Smith (Lecturer)",
    "Admin: Mr. Paul",
  ]);

  const [skills, setSkills] = useState(["React JS", "UI Design"]);
  const [projects, setProjects] = useState(["Portfolio Website"]);
  const [awards, setAwards] = useState(["Best Team Player 2024"]);

  const [newSkill, setNewSkill] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newAward, setNewAward] = useState("");
  const [savedResults, setSavedResults] = useState([]); 

  const [achievements, setAchievements] = useState([
    { title: "UI Design Project", progress: 60, isPublic: true },
    { title: "React Assignment", progress: 30, isPublic: false },
  ]);
  const [newAchievement, setNewAchievement] = useState("");

  const [studentGrades, setStudentGrades] = useState({
    "student1": {
      semesters: [
        {
          name: "Semester 1, 2025",
          courses: [
            { name: "Mathematics", grade: 4.0, credits: 3 },
            { name: "Physics", grade: 3.7, credits: 3 },
          ],
        },
        {
          name: "Semester 2, 2025",
          courses: [
            { name: "Chemistry", grade: 3.3, credits: 3 },
            { name: "Biology", grade: 3.8, credits: 3 },
          ],
        },
      ],
    },
  });

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (!refreshToken) {
      console.log("❌ No refresh token available");
      return null;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.status === 404) {
        console.warn("⚠️ Token refresh endpoint not configured yet. Please add it to Django urls.py");
        console.log("💡 Add: path('api/accounts/token/refresh/', TokenRefreshView.as_view())");
        return null;
      }

      if (!response.ok) {
        console.error("Token refresh failed:", response.status);
        return null;
      }

      const data = await response.json();
      localStorage.setItem("accessToken", data.access);
      console.log("✅ Token refreshed successfully");
      return data.access;
    } catch (error) {
      console.error("❌ Error refreshing token:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchGPARecords = async () => {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        console.log("No token available for GPA records fetch");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/accounts/gpa-records/", {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (response.status === 404) {
          console.log("ℹ️ GPA records endpoint not yet available (404) - this is OK");
          return;
        }

        if (response.status === 401) {
          console.log("🔄 Token expired, attempting refresh...");
          const newToken = await refreshAccessToken();
          
          if (newToken) {
            // Retry with new token
            const retryResponse = await fetch("http://127.0.0.1:8000/api/gpa-records/", {
              headers: { 
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              },
            });
            
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              setSavedResults(data);
              console.log("✅ GPA records loaded after token refresh");
            }
          }
          return;
        }

        if (!response.ok) {
          console.log(`ℹ️ GPA records fetch returned: ${response.status}`);
          return;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setSavedResults(data);
          console.log("✅ GPA records loaded:", data);
        }
        
      } catch (error) {
        console.error("❌ Error fetching GPA records:", error);
      }
    };
    
    // Only fetch if user is logged in
    if (user) {
      fetchGPARecords();
    }
  }, [user]);

  // ==================== FETCH CURRENT USER ====================
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      
      console.log("🔍 Checking authentication...");
      console.log("Token exists:", !!token);

      if (!token) {
        console.log("❌ No token found, redirecting to login...");
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        console.log("📡 Fetching user data from API...");
        
        let response = await fetch("http://127.0.0.1:8000/api/accounts/me/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("API Response status:", response.status);

        // If token expired, try to refresh
        if (response.status === 401) {
          console.log("🔄 Token expired, attempting refresh...");
          const newToken = await refreshAccessToken();
          
          if (newToken) {
            // Retry with new token
            response = await fetch("http://127.0.0.1:8000/api/accounts/me/", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
            });
            
            console.log("API Response status (after refresh):", response.status);
          } else {
            throw new Error("Token refresh failed");
          }
        }

        if (!response.ok) {
          // Try to use cached user data
          const cachedUser = localStorage.getItem("user");
          if (cachedUser) {
            console.log("⚠️ API failed, using cached user data");
            setUser(JSON.parse(cachedUser));
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch user: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ User data received:", data);

        // Update cached user data
        localStorage.setItem("user", JSON.stringify(data));
        setUser(data);

      } catch (err) {
        console.error("❌ Error fetching user:", err);

        // Try cached user as last resort
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) {
          console.log("⚠️ Using cached user data after error");
          setUser(JSON.parse(cachedUser));
        } else {
          console.log("❌ No cached data, clearing storage and redirecting...");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // ==================== HANDLERS ====================
  const handleFileChange = (e) => setFile(e.target.files[0]);
  
  const handleUpload = () => {
    if (!file) return alert("Please select a file first!");
    alert(`Uploaded: ${file.name}`);
    setFile(null);
    setShowUpload(false);
  };

  const handleAddCourse = () => {
    if (newCourse.trim()) {
      setCourses([...courses, newCourse]);
      setNewCourse("");
      setShowCourseModal(false);
    }
  };

  const handleAddAssignment = () => {
    if (newAssignment.trim()) {
      setAssignments([...assignments, newAssignment]);
      setNewAssignment("");
      setShowAssignmentModal(false);
    }
  };

  const handleAddUser = () => {
    if (newUser.trim()) {
      setUsers([...users, newUser]);
      setNewUser("");
      setShowUserModal(false);
    }
  };

  const toggleAchievementPrivacy = (i) => {
    const updated = [...achievements];
    updated[i].isPublic = !updated[i].isPublic;
    setAchievements(updated);
  };

  const endorseAchievement = (i) =>
    alert(`You endorsed: ${achievements[i].title}`);

  const addAchievement = () => {
    if (!newAchievement.trim()) return;
    setAchievements([
      ...achievements,
      { title: newAchievement.trim(), progress: 0, isPublic: true },
    ]);
    setNewAchievement("");
  };

  const removeAchievement = (index) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleLogout = () => {

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("userData");
  
  console.log("✅ Logout successful, redirecting to login...");
  

  setTimeout(() => {
    navigate("/login", { replace: true });
  }, 100);
};

  // ==================== RENDER CONTENT BASED ON ACTIVE PAGE ====================
  const renderContent = () => {
    switch (activePage) {
      case "profile":
        return <ProfilePage user={user} />;
      case "addAchievement":
        return (
          <AddAchievementPage 
            onBack={() => setActivePage("dashboard")} 
            onSave={(newAch) => {
              setAchievements([...achievements, newAch]);
              setActivePage("dashboard");
            }} 
          />
        );
      case "achievementsFeed":
        return <AchievementsFeedPage currentUser={user} />;
      case "adminProfiles":
        return <AdminProfilesPage />;
      case "reports":
        return <AdminReportsPage />;
      case "gpaAnalyzer":
        return <AdminGPAAnalyzer />;
      case "dashboard":
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    if (user.role === "student") {
      return (
        <StudentDashboard 
          user={user} 
          achievements={achievements}
          setActivePage={setActivePage}
        />
      );
    }

    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h3 className="mb-2">👋 Hello, {user.username}!</h3>
          <p className="text-muted">
            Welcome to your <span className="badge bg-primary text-uppercase">{user.role}</span> dashboard.
          </p>
        </motion.div>

        {/* ================= LECTURER DASHBOARD ================= */}
        {user.role === "lecturer" && (
          <>
            <div className="row mb-4">
              <DashboardCard title="Courses" value={courses.length} icon="📚" color="#caffbf" />
              <DashboardCard title="Assignments" value={assignments.length} icon="📋" color="#9bf6ff" />
              <DashboardCard title="Students" value="127" icon="👥" color="#ffd6a5" />
            </div>

            <DashboardSection 
              title="📚 Manage Courses" 
              items={courses} 
              buttonText="➕ Add Course" 
              onClick={() => setShowCourseModal(true)} 
            />
            <DashboardSection 
              title="📋 Manage Assignments" 
              items={assignments} 
              buttonText="➕ Add Assignment" 
              onClick={() => setShowAssignmentModal(true)} 
            />
            <Leaderboard currentUser={user} />
          </>
        )}

        {/* ================= ADMIN DASHBOARD ================= */}
        {user.role === "admin" && (
          <>
            <div className="row mb-4">
              <DashboardCard title="Total Users" value={users.length} icon="👥" color="#caffbf" />
              <DashboardCard title="Active Courses" value={courses.length} icon="📚" color="#9bf6ff" />
              <DashboardCard title="Reports" value="12" icon="📊" color="#ffd6a5" />
            </div>

            <DashboardSection 
              title="👥 Manage Users" 
              items={users} 
              buttonText="➕ Add User" 
              onClick={() => setShowUserModal(true)} 
            />
            <DashboardSection 
              title="📊 Reports" 
              items={[
                "Student Performance Report - Q1", 
                "Course Completion Rate - 2025"
              ]} 
            />
            <Leaderboard currentUser={user} />
          </>
        )}
      </>
    );
  };

  // ==================== LOADING & AUTH CHECK ====================
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "linear-gradient(to right, #a8dadc, #f1faee)" }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "linear-gradient(to right, #a8dadc, #f1faee)" }}>
        <div className="card shadow-lg p-4" style={{ maxWidth: "400px" }}>
          <div className="text-center">
            <h4 className="text-danger mb-3">⚠️ Not Logged In</h4>
            <p className="text-muted mb-4">Please log in to access the dashboard.</p>
            <button className="btn btn-primary w-100" onClick={() => navigate("/login")}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN RETURN ====================
  return (
    <div className="d-flex">
      <Sidebar 
        role={user.role} 
        onNavigate={setActivePage} 
        activePage={activePage}
        onLogout={handleLogout}
      />

      <div
        className="flex-1 overflow-y-auto p-4"
        style={{
          marginLeft: "230px",
          minWidth: "900px",
          minHeight: "100vh",
          background: "linear-gradient(to right, #a8dadc, #f1faee)",
          marginTop: user.role === "student" ? "1500px" : "500px"
        }}
      >
        {renderContent()}
      </div>

      {/* ==================== MODALS ==================== */}
      {showUpload && (
        <Modal title="Upload Portfolio Item" onClose={() => setShowUpload(false)}>
          <input type="file" className="form-control mb-3" onChange={handleFileChange} />
          {file && <div className="alert alert-info">Selected: {file.name}</div>}
          <button className="btn btn-success w-100" onClick={handleUpload}>Upload</button>
        </Modal>
      )}

      {showCourseModal && (
        <Modal title="Add New Course" onClose={() => setShowCourseModal(false)}>
          <input 
            type="text" 
            className="form-control mb-3" 
            placeholder="Enter course name" 
            value={newCourse} 
            onChange={(e) => setNewCourse(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCourse()}
          />
          <button className="btn btn-success w-100" onClick={handleAddCourse}>Add Course</button>
        </Modal>
      )}

      {showAssignmentModal && (
        <Modal title="Add New Assignment" onClose={() => setShowAssignmentModal(false)}>
          <input 
            type="text" 
            className="form-control mb-3" 
            placeholder="Enter assignment title" 
            value={newAssignment} 
            onChange={(e) => setNewAssignment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddAssignment()}
          />
          <button className="btn btn-primary w-100" onClick={handleAddAssignment}>Add Assignment</button>
        </Modal>
      )}

      {showUserModal && (
        <Modal title="Add New User" onClose={() => setShowUserModal(false)}>
          <input 
            type="text" 
            className="form-control mb-3" 
            placeholder="Enter user name and role" 
            value={newUser} 
            onChange={(e) => setNewUser(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
          />
          <button className="btn btn-success w-100" onClick={handleAddUser}>Add User</button>
        </Modal>
      )}
    </div>
  );
}

// ==================== REUSABLE COMPONENTS ====================
const DashboardCard = ({ title, value, icon, color }) => (
  <div className="col-md-3 mb-3">
    <motion.div 
      className="card shadow text-center p-4 border-0" 
      style={{ backgroundColor: color }} 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="fs-1 mb-2">{icon}</div>
      <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: "0.85rem" }}>{title}</h6>
      <h2 className="mb-0 fw-bold">{value}</h2>
    </motion.div>
  </div>
);

const DashboardSection = ({ title, items, buttonText, onClick }) => (
  <motion.div 
    className="card shadow mb-4 p-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <h5 className="mb-3">{title}</h5>
    <ul className="list-group mb-3">
      {items.map((item, idx) => (
        <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
          {item}
          <span className="badge bg-primary rounded-pill">{idx + 1}</span>
        </li>
      ))}
    </ul>
    {buttonText && (
      <button className="btn btn-success" onClick={onClick}>
        {buttonText}
      </button>
    )}
  </motion.div>
);

const Modal = ({ title, children, onClose }) => (
  <div 
    className="modal fade show d-block" 
    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    onClick={(e) => e.target.className.includes('modal fade') && onClose()}
  >
    <div className="modal-dialog modal-dialog-centered">
      <motion.div 
        className="modal-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="modal-header">
          <h5 className="modal-title">{title}</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body">{children}</div>
      </motion.div>
    </div>
  </div>
);

const FeatureCard = ({ title, items, newEntry, setNewEntry, onAdd, onDelete }) => (
  <motion.div 
    className="card shadow mb-4 p-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <h5 className="mb-3">{title}</h5>
    <ul className="list-group mb-3">
      {items.length > 0 ? (
        items.map((item, i) => (
          <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{item}</span>
            <button 
              className="btn btn-sm btn-outline-danger" 
              onClick={() => onDelete(i)}
            >
              Remove
            </button>
          </li>
        ))
      ) : (
        <li className="list-group-item text-muted text-center">No entries yet. Add one below!</li>
      )}
    </ul>
    <div className="input-group">
      <input 
        type="text" 
        className="form-control" 
        placeholder={`Add new ${title.split(' ')[1] || 'item'}...`}
        value={newEntry} 
        onChange={(e) => setNewEntry(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
      />
      <button className="btn btn-primary" onClick={onAdd}>
        ➕ Add
      </button>
    </div>
  </motion.div>
);

export default Dashboard;