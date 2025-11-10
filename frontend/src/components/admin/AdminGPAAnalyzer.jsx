import React, { useState, useEffect } from "react";

const gradeScale = [
  { min: 80, max: 100, grade: "A", points: 5.0 },
  { min: 75, max: 79, grade: "B+", points: 4.5 },
  { min: 70, max: 74, grade: "B", points: 4.0 },
  { min: 65, max: 69, grade: "C+", points: 3.5 },
  { min: 60, max: 64, grade: "C", points: 3.0 },
  { min: 55, max: 59, grade: "D+", points: 2.5 },
  { min: 50, max: 54, grade: "D", points: 2.0 },
  { min: 45, max: 49, grade: "E", points: 1.5 },
  { min: 40, max: 44, grade: "E–", points: 1.0 },
  { min: 0,  max: 39, grade: "F", points: 0.0 },
];

const AdminGPAAnalyzer = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [semesters, setSemesters] = useState([
    { name: "Semester 1", subjects: [] },
  ]);
  const [savedResults, setSavedResults] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch registered students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const token = localStorage.getItem("accessToken");
    
    try {
      const response = await fetch("http://127.0.0.1:8000/api/accounts/students/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      console.log("Fetched students:", data);
      
      // Filter only students (not lecturers or admins)
      const studentUsers = data.filter(user => user.role === "student");
      setStudents(studentUsers);
    } catch (error) {
      console.error("Error fetching students:", error);
      alert("Failed to load students. Using demo data.");
      // Fallback to demo data
      setStudents([
        { id: 1, username: "student1", email: "student1@example.com" },
        { id: 2, username: "student2", email: "student2@example.com" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addSemester = () => {
    setSemesters([...semesters, { name: `Semester ${semesters.length + 1}`, subjects: [] }]);
  };

  const addSubject = (semIndex) => {
    const newSem = [...semesters];
    newSem[semIndex].subjects.push({ name: "", marks: "", credits: "" });
    setSemesters(newSem);
  };

  const updateSubject = (semIndex, subjIndex, field, value) => {
    const updated = [...semesters];
    updated[semIndex].subjects[subjIndex][field] = value;
    setSemesters(updated);
  };

  const getGradePoint = (marks) => {
    const scale = gradeScale.find((g) => marks >= g.min && marks <= g.max);
    return scale ? scale.points : 0;
  };

  const calculateGPA = (subjects) => {
    let totalPoints = 0;
    let totalCredits = 0;
    subjects.forEach((s) => {
      const gp = getGradePoint(parseFloat(s.marks));
      totalPoints += gp * parseFloat(s.credits || 0);
      totalCredits += parseFloat(s.credits || 0);
    });
    return totalCredits ? (totalPoints / totalCredits).toFixed(2) : "0.00";
  };

  const calculateCGPA = () => {
    const gpas = semesters.map((s) => parseFloat(calculateGPA(s.subjects)));
    const valid = gpas.filter((g) => !isNaN(g));
    if (!valid.length) return "0.00";
    const total = valid.reduce((a, b) => a + b, 0);
    return (total / valid.length).toFixed(2);
  };

  const resetCalculator = () => {
    setSemesters([{ name: "Semester 1", subjects: [] }]);
    setSelectedStudent("");
    setShowSuccess(false);
  };

  const saveResults = async () => {
    if (!selectedStudent) {
      alert("Please select a student first!");
      return;
    }

    const selectedStudentData = students.find(s => s.username === selectedStudent);
    if (!selectedStudentData) {
      alert("Selected student not found!");
      return;
    }

    const cgpa = calculateCGPA();

    const resultsToSave = semesters
      .filter(s => s.subjects.length > 0) // skip empty semesters
      .map(s => ({
        student: selectedStudentData.username,
        studentEmail: selectedStudentData.email,
        semester: s.name,
        subjects: s.subjects,
        gpa: calculateGPA(s.subjects),
        cgpa: cgpa,
        timestamp: new Date().toLocaleString(),
      }));

    // Update local state for preview
    setSavedResults(prev => [...prev, ...resultsToSave]);

    // Save each semester to backend
    let allSaved = true;
    for (const record of resultsToSave) {
      const success = await saveToBackend(record, selectedStudentData.id);
      if (!success) allSaved = false;
    }

    if (allSaved) {
      setShowSuccess(true);
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    }
  };

  const saveToBackend = async (record, studentId) => {
    const token = localStorage.getItem("accessToken");

    const payload = {
      student: studentId,
      semester: record.semester,
      subjects: record.subjects,
      gpa: parseFloat(record.gpa),
      cgpa: parseFloat(record.cgpa),
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/accounts/gpa-records/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to save GPA record: ${errText}`);
      }

      console.log(`✅ GPA record saved for ${record.semester}`);
      return true;
    } catch (err) {
      console.error(err);
      alert(`Failed to save GPA record for ${record.semester}. Check console.`);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading students...</span>
        </div>
        <p className="mt-2">Loading students...</p>
      </div>
    );
  }

  return (
    <div 
      className="container mt-4" 
      style={{ 
        marginLeft: "0px", 
        paddingTop: "0px",
        marginTop: "0px",
        height: "100vh",
        overflow: "auto",
        transform: "scale(0.9)",
        transformOrigin: "top left" 
      }}
    >
      <h3 className="mb-3 text-center">🎓 GPA/CGPA Calculator (Makerere Standard)</h3>

      {/* Success Message */}
      {showSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <strong>✅ Success!</strong> Results saved for {selectedStudent}. You can continue calculating or start over.
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setShowSuccess(false)}
          ></button>
        </div>
      )}

      <div className="mb-3">
        <label className="form-label">
          Select Student: 
          <span className="badge bg-info ms-2">{students.length} students</span>
        </label>
        <select
          className="form-select"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
        >
          <option value="">-- Select Student --</option>
          {students.length > 0 ? (
            students.map((student) => (
              <option key={student.id || student.username} value={student.username}>
                {student.username} ({student.email})
              </option>
            ))
          ) : (
            <option disabled>No students registered yet</option>
          )}
        </select>
      </div>

      {semesters.map((sem, semIndex) => (
        <div key={semIndex} className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5>{sem.name}</h5>
            <button
              className="btn btn-sm btn-success"
              onClick={() => addSubject(semIndex)}
            >
              + Add Subject
            </button>
          </div>
          <div className="card-body">
            {sem.subjects.length > 0 ? (
              sem.subjects.map((subj, subjIndex) => (
                <div key={subjIndex} className="row mb-2">
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="Subject Name"
                      value={subj.name}
                      onChange={(e) =>
                        updateSubject(semIndex, subjIndex, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Marks (0-100)"
                      min="0"
                      max="100"
                      value={subj.marks}
                      onChange={(e) =>
                        updateSubject(semIndex, subjIndex, "marks", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Credit Units"
                      min="1"
                      value={subj.credits}
                      onChange={(e) =>
                        updateSubject(semIndex, subjIndex, "credits", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-md-2">
                    <button
                      className="btn btn-sm btn-outline-danger w-100"
                      onClick={() => {
                        const updated = [...semesters];
                        updated[semIndex].subjects.splice(subjIndex, 1);
                        setSemesters(updated);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted text-center">No subjects added yet. Click "Add Subject" above.</p>
            )}

            <div className="text-end mt-3 p-2 bg-light rounded">
              <strong>Semester GPA:</strong> 
              <span className="badge bg-primary ms-2 fs-5">{calculateGPA(sem.subjects)}</span>
            </div>
          </div>
        </div>
      ))}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-outline-primary" onClick={addSemester}>
          + Add Semester
        </button>
        <div className="alert alert-info mb-0 py-2">
          <strong>Overall CGPA:</strong> 
          <span className="badge bg-success ms-2 fs-4">{calculateCGPA()}</span>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="d-flex justify-content-center gap-3">
          <button
            className="btn btn-success btn-lg"
            disabled={!selectedStudent || semesters.every(s => s.subjects.length === 0)}
            onClick={saveResults}
          >
            💾 Save Results
          </button>
          <button
            className="btn btn-outline-secondary btn-lg"
            onClick={resetCalculator}
          >
            🔄 New Calculation
          </button>
        </div>
        {!selectedStudent && (
          <p className="text-danger mt-2 mb-0">Please select a student first</p>
        )}
      </div>

      {/* Saved Results Preview */}
      {savedResults.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-3">📊 Saved GPA/CGPA Records</h4>
          <div className="list-group">
            {savedResults.map((r, i) => (
              <div key={i} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">
                      <strong>{r.student}</strong> ({r.studentEmail})
                    </h6>
                    <p className="mb-1 text-muted small">
                      {r.semester}: GPA {r.gpa} | CGPA {r.cgpa}
                    </p>
                    <small className="text-muted">Saved: {r.timestamp}</small>
                  </div>
                  <span className="badge bg-success fs-5">CGPA: {r.cgpa}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGPAAnalyzer;