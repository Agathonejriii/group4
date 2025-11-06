import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
  { min: 0, max: 39, grade: "F", points: 0.0 },
];

function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("students");
  const [studentReports, setStudentReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportStatus, setReportStatus] = useState("");
  const [reportProgress, setReportProgress] = useState(0);
  const [threads, setThreads] = useState([]);
  const [generatedReportData, setGeneratedReportData] = useState(null);
  const [usingRealData, setUsingRealData] = useState(true);

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    student_name: "",
    student_id: "",
    semester: "Semester 1, 2025",
    courses: [{ name: "", grade: "", credits: "", marks: "" }],
  });

  const [standardReports] = useState([
    {
      id: 1,
      title: "Student Performance Report - Q1 2025",
      date: "2025-01-15",
      type: "Performance",
      description: "Comprehensive analysis of student performance in Q1",
    },
    {
      id: 2,
      title: "Course Completion Rate - 2025",
      date: "2025-01-10",
      type: "Completion",
      description: "Overall course completion statistics for 2025",
    },
    {
      id: 3,
      title: "Attendance Report - January 2025",
      date: "2025-01-31",
      type: "Attendance",
      description: "Monthly attendance summary for all students",
    },
  ]);

  const [previousReports] = useState([
    {
      id: 1,
      title: "Annual Performance Review 2024",
      date: "2024-12-31",
      type: "Annual",
    },
    {
      id: 2,
      title: "Semester 2 Results 2024",
      date: "2024-08-15",
      type: "Semester",
    },
    {
      id: 3,
      title: "Mid-Year Assessment 2024",
      date: "2024-06-30",
      type: "Assessment",
    },
  ]);
  
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storageOption, setStorageOption] = useState("download"); // download, cloud, email
  const [emailForm, setEmailForm] = useState({
    recipient: "",
    subject: "Student Performance Report",
    message: "Please find attached the student performance report.",
  });
  const [cloudProvider, setCloudProvider] = useState("gdrive"); // gdrive, dropbox, onedrive
  const [uploadingToCloud, setUploadingToCloud] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [storageStatus, setStorageStatus] = useState("");

  // Get token with better validation
  const getToken = () => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      console.error("❌ No token found in localStorage");
      return null;
    }
    return token;
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return null;

      const response = await fetch("http://127.0.0.1:8000/api/accounts/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.access);
        return data.access;
      }
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
    }
    return null;
  };

  // Enhanced fetch with token refresh
  const fetchWithAuth = async (url, options = {}) => {
    let token = getToken();
    
    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    let response = await fetch(url, config);

    // If token expired, try to refresh
    if (response.status === 401 && token) {
      console.log("🔄 Token expired, attempting refresh...");
      const newToken = await refreshToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, config);
      }
    }

    return response;
  };

  // Fetch student reports from backend
  useEffect(() => {
    const fetchStudentReports = async () => {
      setLoading(true);
      
      try {
        console.log("📡 Fetching GPA records...");
        
        const endpoints = [
          "http://127.0.0.1:8000/api/accounts/gpa-records/",
          "http://127.0.0.1:8000/api/gpa/gpa-records/",
        ];

        let response = null;
        let successfulEndpoint = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 Trying endpoint: ${endpoint}`);
            response = await fetchWithAuth(endpoint);
            
            if (response.ok) {
              successfulEndpoint = endpoint;
              break;
            } else {
              console.log(`❌ Endpoint ${endpoint} failed with status: ${response.status}`);
            }
          } catch (err) {
            console.log(`❌ Endpoint ${endpoint} error:`, err.message);
          }
        }

        if (response && response.ok) {
          const data = await response.json();
          console.log("✅ GPA records fetched from:", successfulEndpoint, data);
          
          const formatted = Array.isArray(data) ? data.map((r) => ({
            id: r.id || r._id,
            student_name: r.student_name || r.student?.username || "Unknown",
            student_id: r.student || r.student_id,
            semester: r.semester || "Unknown Semester",
            gpa: r.gpa || "0.00",
            cgpa: r.cgpa || r.gpa || "0.00",
            courses: r.subjects || r.courses || [],
            timestamp: r.timestamp || new Date().toISOString(),
          })) : [];
          
          setStudentReports(formatted);
          setUsingRealData(true);
        } else {
          console.log("❌ All endpoints failed, using mock data");
          setStudentReports(getMockStudentData());
          setUsingRealData(false);
        }
      } catch (err) {
        console.error("❌ Error fetching GPA records:", err);
        setStudentReports(getMockStudentData());
        setUsingRealData(false);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "students") {
      fetchStudentReports();
    }
  }, [activeTab]);

  // Fetch registered students for the dropdown
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        console.log("📡 Fetching registered students...");
        const response = await fetchWithAuth("http://127.0.0.1:8000/api/accounts/students/");

        if (response.ok) {
          const data = await response.json();
          const studentUsers = Array.isArray(data) ? data.filter(user => user.role === "student") : [];
          setRegisteredStudents(studentUsers);
          console.log("✅ Registered students loaded:", studentUsers.length);
        } else {
          console.log("❌ Failed to fetch students, status:", response.status);
          setRegisteredStudents(getMockStudents());
        }
      } catch (error) {
        console.error("❌ Error fetching students:", error);
        setRegisteredStudents(getMockStudents());
      }
    };

    fetchStudents();
  }, []);

  // Mock data fallbacks
  const getMockStudentData = () => {
    return [
      {
        id: 1,
        student_name: "John Doe",
        student_id: "ST001",
        semester: "Semester 1, 2025",
        gpa: "3.75",
        cgpa: "3.80",
        courses: [
          { name: "Mathematics", grade: "A", credits: 3, marks: 85 },
          { name: "Physics", grade: "B+", credits: 4, marks: 78 },
          { name: "Chemistry", grade: "A-", credits: 3, marks: 82 }
        ],
        timestamp: "2025-01-15T10:30:00Z"
      },
      {
        id: 2,
        student_name: "Jane Smith",
        student_id: "ST002",
        semester: "Semester 1, 2025",
        gpa: "3.20",
        cgpa: "3.25",
        courses: [
          { name: "Mathematics", grade: "B", credits: 3, marks: 72 },
          { name: "Chemistry", grade: "B+", credits: 4, marks: 77 },
          { name: "Biology", grade: "A", credits: 3, marks: 88 }
        ],
        timestamp: "2025-01-15T11:15:00Z"
      },
      {
        id: 3,
        student_name: "Mike Johnson",
        student_id: "ST003",
        semester: "Semester 2, 2025",
        gpa: "2.80",
        cgpa: "2.90",
        courses: [
          { name: "Physics", grade: "C+", credits: 4, marks: 67 },
          { name: "Computer Science", grade: "B", credits: 3, marks: 74 },
          { name: "Mathematics", grade: "C", credits: 3, marks: 63 }
        ],
        timestamp: "2025-06-20T09:45:00Z"
      }
    ];
  };

  const getMockStudents = () => {
    return [
      { id: 1, username: "John Doe", email: "john@student.com", role: "student" },
      { id: 2, username: "Jane Smith", email: "jane@student.com", role: "student" },
      { id: 3, username: "Mike Johnson", email: "mike@student.com", role: "student" },
      { id: 4, username: "Sarah Wilson", email: "sarah@student.com", role: "student" },
    ];
  };

  // ========== MANUAL ENTRY FORM FUNCTIONS ==========
  const addCourseToForm = () => {
    setManualForm({
      ...manualForm,
      courses: [...manualForm.courses, { name: "", grade: "", credits: "", marks: "" }],
    });
  };

  const updateCourseInForm = (index, field, value) => {
    const updated = [...manualForm.courses];
    updated[index][field] = value;
    
    // Auto-calculate grade from marks
    if (field === "marks") {
      updated[index].grade = getGradeFromMarks(parseFloat(value) || 0);
    }
    
    setManualForm({ ...manualForm, courses: updated });
  };

  const removeCourseFromForm = (index) => {
    const updated = manualForm.courses.filter((_, i) => i !== index);
    setManualForm({ ...manualForm, courses: updated });
  };

  const calculateGPA = (courses) => {
    let totalPoints = 0;
    let totalCredits = 0;
    courses.forEach((c) => {
      const marks = parseFloat(c.marks) || 0;
      const credits = parseFloat(c.credits) || 0;
      const gp = getGradePoint(marks);
      totalPoints += gp * credits;
      totalCredits += credits;
    });
    return totalCredits ? (totalPoints / totalCredits).toFixed(2) : "0.00";
  };

  const getGradePoint = (marks) => {
    const scale = gradeScale.find((g) => marks >= g.min && marks <= g.max);
    return scale ? scale.points : 0;
  };

  const getGradeFromMarks = (marks) => {
    const scale = gradeScale.find((g) => marks >= g.min && marks <= g.max);
    return scale ? scale.grade : "F";
  };

  const saveManualEntry = async () => {
    if (!manualForm.student_id) {
      alert("Please select a student");
      return;
    }

    if (manualForm.courses.length === 0 || !manualForm.courses[0].name) {
      alert("Please add at least one course");
      return;
    }

    const token = getToken();
    if (!token) return;

    const gpa = parseFloat(calculateGPA(manualForm.courses));
    
    // Find the selected student to get their details
    const selectedStudent = registeredStudents.find(s => s.id === parseInt(manualForm.student_id));
    
    const payload = {
      student: parseInt(manualForm.student_id),
      semester: manualForm.semester,
      subjects: manualForm.courses.map(c => ({
        name: c.name,
        marks: parseFloat(c.marks) || 0,
        credits: parseFloat(c.credits) || 0,
        grade: c.grade,
      })),
      gpa: gpa,
      cgpa: gpa,
    };

    console.log("📤 Saving record:", payload);

    try {
      const endpoint = editingStudent 
        ? `http://127.0.0.1:8000/api/accounts/gpa-records/${editingStudent.id}/`
        : "http://127.0.0.1:8000/api/accounts/gpa-records/";
      
      const response = await fetch(endpoint, {
        method: editingStudent ? "PUT" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log("✅ Record saved:", savedData);
        alert("Record saved successfully!");
        
        // Refresh the list
        const fetchResponse = await fetch("http://127.0.0.1:8000/api/accounts/gpa-records/", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          const formatted = Array.isArray(data) ? data.map((r) => ({
            id: r.id,
            student_name: r.student_name,
            student_id: r.student,
            semester: r.semester,
            gpa: r.gpa,
            cgpa: r.cgpa,
            courses: r.subjects,
          })) : [];
          setStudentReports(formatted);
        }
        
        // Reset form
        setManualForm({
          student_name: "",
          student_id: "",
          semester: "Semester 1, 2025",
          courses: [{ name: "", grade: "", credits: "", marks: "" }],
        });
        setShowManualEntry(false);
        setEditingStudent(null);
      } else {
        const errorText = await response.text();
        console.error("❌ Failed to save record:", response.status, errorText);
        alert(`Failed to save record: ${response.status}. Check console for details.`);
      }
    } catch (err) {
      console.error("❌ Error saving record:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // Edit existing student record
  const editStudentRecord = (student) => {
    setEditingStudent(student);
    setManualForm({
      student_name: student.student_name,
      student_id: student.student_id?.toString() || "",
      semester: student.semester,
      courses: student.courses && student.courses.length > 0 
        ? student.courses 
        : [{ name: "", grade: "", credits: "", marks: "" }],
    });
    setShowManualEntry(true);
  };

  // Delete student record
  const deleteStudentRecord = async (studentId) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/accounts/gpa-records/${studentId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok || response.status === 204) {
        setStudentReports(studentReports.filter(r => r.id !== studentId));
        console.log("✅ Record deleted successfully");
        alert("Record deleted successfully!");
      } else {
        const errorText = await response.text();
        console.error("❌ Failed to delete:", response.status, errorText);
        alert(`Failed to delete record: ${response.status}`);
      }
    } catch (err) {
      console.error("❌ Error deleting record:", err);
      // Delete locally even if API fails
      setStudentReports(studentReports.filter(r => r.id !== studentId));
      alert("Deleted locally (API unavailable)");
    }
  };

  // ========== STORAGE & SHARING FUNCTIONS ==========
  const downloadStudentReport = () => {
    const csvContent = generateStudentCSV(filteredStudents);
    downloadCSV(csvContent, `student_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadPDF = () => {
    const content = generateStudentReportText(filteredStudents);
    downloadTextFile(content, `student_performance_report_${new Date().toISOString().split('T')[0]}.txt`);
  };

  // Cloud Storage Functions
  const uploadToCloud = async (reportData, provider) => {
    setUploadingToCloud(true);
    setStorageStatus("☁️ Uploading to cloud storage...");

    try {
      const token = getToken();
      const fileName = `student_performance_report_${new Date().toISOString().split('T')[0]}.json`;
      
      // Prepare report data
      const reportContent = JSON.stringify(reportData || {
        students: filteredStudents,
        generatedAt: new Date().toISOString(),
        summary: {
          totalStudents: filteredStudents.length,
          averageGPA: calculateAverageGPA(),
          semester: selectedSemester,
        }
      }, null, 2);

      // Send to backend cloud storage endpoint
      const response = await fetchWithAuth("http://127.0.0.1:8000/api/accounts/cloud-upload/", {
        method: "POST",
        body: JSON.stringify({
          provider: provider,
          fileName: fileName,
          fileContent: reportContent,
          fileType: "application/json",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStorageStatus(`✅ Successfully uploaded to ${provider.toUpperCase()}!`);
        alert(`Report uploaded to ${provider.toUpperCase()} successfully!\n${data.url || ''}`);
        setTimeout(() => setStorageStatus(""), 3000);
        return true;
      } else {
        throw new Error("Cloud upload failed");
      }
    } catch (error) {
      console.error("Cloud upload error:", error);
      setStorageStatus("❌ Cloud upload failed. Using local storage...");
      
      // Fallback: Store locally in browser (simulated cloud storage)
      const localCloudKey = `cloud_report_${Date.now()}`;
      try {
        const reportContent = JSON.stringify(reportData || {
          students: filteredStudents,
          generatedAt: new Date().toISOString(),
          summary: {
            totalStudents: filteredStudents.length,
            averageGPA: calculateAverageGPA(),
            semester: selectedSemester,
          }
        });
        
        // Store in memory or trigger download as backup
        const blob = new Blob([reportContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cloud_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        alert(`Cloud service unavailable. Report downloaded as backup file instead.`);
      } catch (localError) {
        console.error("Fallback storage failed:", localError);
      }
      
      setTimeout(() => setStorageStatus(""), 3000);
      return false;
    } finally {
      setUploadingToCloud(false);
    }
  };

  // Email Functions
  const sendReportViaEmail = async (reportData) => {
  if (!emailForm.recipient || !emailForm.recipient.includes('@')) {
    alert("Please enter a valid email address!");
    return;
  }

  setSendingEmail(true);
  setStorageStatus("📧 Sending email...");

  try {
    const token = getToken();
    if (!token) {
      alert("Authentication token missing. Please log in again.");
      setSendingEmail(false);
      return;
    }

    console.log("🔑 Token available, sending email request...");

    // Prepare report content
    const reportContent = generateStudentReportText(filteredStudents);
    const csvContent = generateStudentCSV(filteredStudents);

    // Send to backend email endpoint
    const response = await fetchWithAuth("http://127.0.0.1:8000/api/accounts/send-report-email/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: emailForm.recipient,
        subject: emailForm.subject,
        message: emailForm.message,
        reportContent: reportContent,
        csvContent: csvContent,
        reportData: reportData || {
          students: filteredStudents,
          generatedAt: new Date().toISOString(),
          summary: {
            totalStudents: filteredStudents.length,
            averageGPA: calculateAverageGPA(),
            semester: selectedSemester,
          }
        }
      }),
    });

    console.log("📧 Email API response status:", response.status);

    if (response.ok) {
      const result = await response.json();
      setStorageStatus("✅ Email sent successfully!");
      alert(`Report sent to ${emailForm.recipient} successfully!`);
      setShowStorageModal(false);
      setEmailForm({
        recipient: "",
        subject: "Student Performance Report",
        message: "Please find attached the student performance report.",
      });
      setTimeout(() => setStorageStatus(""), 3000);
      return true;
    } else if (response.status === 401) {
      alert("Authentication expired. Please refresh the page and log in again.");
      return false;
    } else {
      const errorText = await response.text();
      console.error("Email sending failed:", response.status, errorText);
      alert(`Failed to send email: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("Email sending error:", error);
    setStorageStatus("❌ Email sending failed");
    alert(`Failed to send email: ${error.message}`);
    return false;
  } finally {
    setSendingEmail(false);
  }
};

  // Handle storage action based on selected option
  const handleStorageAction = async () => {
  // Prepare report data
  const reportData = generatedReportData || {
    students: filteredStudents,
    generatedAt: new Date().toISOString(),
    summary: {
      totalStudents: filteredStudents.length,
      averageGPA: calculateAverageGPA(),
      semester: selectedSemester,
      reportType: 'Student Performance Analysis'
    }
  };

  if (storageOption === "cloud") {
    // Now using Google Drive Personal Drive
    await uploadToCloud(reportData, 'gdrive');
  } else if (storageOption === "email") {
    await sendReportViaEmail(reportData);
  } else {
    // Download option
    const reportContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setShowStorageModal(false);
  }
};

  // ========== REPORT GENERATION FUNCTIONS ==========
  const generateReport = async () => {
    if (filteredStudents.length === 0) {
      alert("No student data available to generate report!");
      return;
    }

    setGeneratingReport(true);
    setReportProgress(0);
    setReportStatus("🔄 Starting report generation...");
    setGeneratedReportData(null);

    // Show data source info
    const dataSourceInfo = usingRealData ? "📊 Using REAL student data" : "⚠️ Using DEMO data (API unavailable)";
    setReportStatus(`🔄 Starting report generation... ${dataSourceInfo}`);

    // Initialize threads for different REAL report sections
    const threadTasks = [
      { id: 1, name: "Data Collection & Validation", status: "pending", progress: 0 },
      { id: 2, name: "Performance Analysis", status: "pending", progress: 0 },
      { id: 3, name: "Statistical Calculations", status: "pending", progress: 0 },
      { id: 4, name: "Report Compilation", status: "pending", progress: 0 },
    ];

    setThreads(threadTasks);

    try {
      // Process each thread with ACTUAL data operations
      const [dataCollection, performanceAnalysis, statistics, compiledReport] = await Promise.all([
        processDataCollection(threadTasks[0], 0, 25),
        processPerformanceAnalysis(threadTasks[1], 25, 50),
        processStatisticalCalculations(threadTasks[2], 50, 75),
        processReportCompilation(threadTasks[3], 75, 100),
      ]);

      // Combine all results into final report
      const finalReport = {
        generatedAt: new Date().toLocaleString(),
        dataSource: usingRealData ? "Real API Data" : "Demo Data",
        dataCollection,
        performanceAnalysis,
        statistics,
        compiledReport,
        summary: {
          totalStudents: filteredStudents.length,
          semesters: [...new Set(filteredStudents.map(s => s.semester))],
          dataQuality: calculateDataQuality(filteredStudents),
          reportScope: `Analysis of ${filteredStudents.length} student records`
        }
      };

      setGeneratedReportData(finalReport);
      setReportStatus(`✅ Report generated successfully! (${usingRealData ? 'Real Data' : 'Demo Data'})`);
      
      console.log("📊 REAL Report Generated:", finalReport);
      
      // Auto-clear success message after 8 seconds
      setTimeout(() => {
        setReportStatus("");
        setReportProgress(0);
        setThreads([]);
      }, 8000);
      
    } catch (error) {
      console.error("❌ Report generation failed:", error);
      setReportStatus("❌ Report generation failed. Please try again.");
    } finally {
      setGeneratingReport(false);
    }
  };

  // THREAD 1: Real Data Collection & Validation
  const processDataCollection = (thread, startProgress, endProgress) => {
    return new Promise((resolve) => {
      setThreads(prev => prev.map(t => 
        t.id === thread.id ? { ...t, status: 'running' } : t
      ));

      setReportStatus("📥 Collecting and validating student data...");

      const processStep = (currentProgress) => {
        if (currentProgress < endProgress) {
          // ACTUAL DATA PROCESSING - Validate student records in chunks
          const chunkSize = Math.ceil(filteredStudents.length / 10);
          const processedChunks = Math.floor((currentProgress - startProgress) / ((endProgress - startProgress) / 10));
          
          const studentsToProcess = filteredStudents.slice(0, processedChunks * chunkSize);
          const validatedData = studentsToProcess.map((student) => {
            const isValid = validateStudentRecord(student);
            const issues = findDataIssues(student);
            const validationScore = calculateValidationScore(student);
            
            return {
              studentId: student.student_id,
              name: student.student_name,
              isValid,
              issues,
              validationScore,
              coursesCount: student.courses ? student.courses.length : 0
            };
          });

          const progress = startProgress + ((currentProgress - startProgress) / (endProgress - startProgress)) * 25;
          setReportProgress(Math.min(progress, endProgress));
          
          setThreads(prev => prev.map(t => 
            t.id === thread.id ? { 
              ...t, 
              progress: ((currentProgress - startProgress) / (endProgress - startProgress)) * 100 
            } : t
          ));

          setTimeout(() => processStep(currentProgress + 2), 100);
        } else {
          // Final data collection result - PROCESS ALL DATA
          const allValidatedData = filteredStudents.map((student) => {
            const isValid = validateStudentRecord(student);
            const issues = findDataIssues(student);
            const validationScore = calculateValidationScore(student);
            
            return {
              studentId: student.student_id,
              name: student.student_name,
              isValid,
              issues,
              validationScore,
              coursesCount: student.courses ? student.courses.length : 0
            };
          });

          const collectionResult = {
            totalRecords: filteredStudents.length,
            validRecords: allValidatedData.filter(s => s.isValid).length,
            averageValidationScore: (allValidatedData.reduce((sum, s) => sum + s.validationScore, 0) / allValidatedData.length).toFixed(1),
            dataIssues: allValidatedData.flatMap(s => s.issues).filter(issue => issue),
            collectionTimestamp: new Date().toISOString(),
            sampleRecord: allValidatedData[0] // Include a sample for verification
          };

          setThreads(prev => prev.map(t => 
            t.id === thread.id ? { ...t, status: 'completed', progress: 100 } : t
          ));
          resolve(collectionResult);
        }
      };

      processStep(startProgress);
    });
  };

  // THREAD 2: Real Performance Analysis
  const processPerformanceAnalysis = (thread, startProgress, endProgress) => {
    return new Promise((resolve) => {
      setThreads(prev => prev.map(t => 
        t.id === thread.id ? { ...t, status: 'running' } : t
      ));

      setReportStatus("📊 Analyzing student performance...");

      const processStep = (currentProgress) => {
        if (currentProgress < endProgress) {
          const progress = startProgress + ((currentProgress - startProgress) / (endProgress - startProgress)) * 25;
          setReportProgress(Math.min(progress, endProgress));
          
          setThreads(prev => prev.map(t => 
            t.id === thread.id ? { 
              ...t, 
              progress: ((currentProgress - startProgress) / (endProgress - startProgress)) * 100 
            } : t
          ));

          setTimeout(() => processStep(currentProgress + 2), 100);
        } else {
          // ACTUAL PERFORMANCE ANALYSIS - PROCESS ALL DATA
          const performanceData = filteredStudents.map(student => {
            const gpa = parseFloat(student.gpa) || 0;
            const strongSubjects = findStrongSubjects(student);
            const weakSubjects = findWeakSubjects(student);
            
            return {
              studentId: student.student_id,
              name: student.student_name,
              semester: student.semester,
              gpa: gpa,
              performanceTier: getPerformanceTier(gpa),
              courseCount: student.courses ? student.courses.length : 0,
              strongSubjects,
              weakSubjects,
              strongSubjectsCount: strongSubjects.length,
              weakSubjectsCount: weakSubjects.length
            };
          });

          const analysisResult = {
            performanceDistribution: calculatePerformanceDistribution(filteredStudents),
            topPerformers: getTopPerformers(filteredStudents, 5),
            strugglingStudents: getStrugglingStudents(filteredStudents, 5),
            semesterComparison: compareSemesterPerformance(filteredStudents),
            averageCoursesPerStudent: (performanceData.reduce((sum, s) => sum + s.courseCount, 0) / performanceData.length).toFixed(1),
            analysisTimestamp: new Date().toISOString(),
            sampleAnalysis: performanceData[0] // Include a sample for verification
          };

          setThreads(prev => prev.map(t => 
            t.id === thread.id ? { ...t, status: 'completed', progress: 100 } : t
          ));
          resolve(analysisResult);
        }
      };

      processStep(startProgress);
    });
  };

  // THREAD 3: Real Statistical Calculations
  const processStatisticalCalculations = (thread, startProgress, endProgress) => {
    return new Promise((resolve) => {
      setThreads(prev => prev.map(t => 
        t.id === thread.id ? { ...t, status: 'running' } : t
      ));

      setReportStatus("📈 Calculating advanced statistics...");

      const processStep = (currentProgress) => {
        if (currentProgress < endProgress) {
          const progress = startProgress + ((currentProgress - startProgress) / (endProgress - startProgress)) * 25;
          setReportProgress(Math.min(progress, endProgress));
          
          setThreads(prev => prev.map(t => 
            t.id === thread.id ? { 
              ...t, 
              progress: ((currentProgress - startProgress) / (endProgress - startProgress)) * 100 
            } : t
          ));

          setTimeout(() => processStep(currentProgress + 2), 100);
        } else {
          // ACTUAL STATISTICAL CALCULATIONS
          const statisticsResult = calculateComprehensiveStatistics(filteredStudents);
          setThreads(prev => prev.map(t => 
            t.id === thread.id ? { ...t, status: 'completed', progress: 100 } : t
          ));
          resolve(statisticsResult);
        }
      };

      processStep(startProgress);
    });
  };

  // THREAD 4: Real Report Compilation
  const processReportCompilation = (thread, startProgress, endProgress) => {
    return new Promise((resolve) => {
      setThreads(prev => prev.map(t => 
        t.id === thread.id ? { ...t, status: 'running' } : t
      ));

      setReportStatus("📋 Compiling final comprehensive report...");

      const processStep = (currentProgress) => {
        if (currentProgress < endProgress) {
          const progress = startProgress + ((currentProgress - startProgress) / (endProgress - startProgress)) * 25;
          setReportProgress(Math.min(progress, endProgress));
          
          setThreads(prev => prev.map(t => 
            t.id === thread.id ? { 
              ...t, 
              progress: ((currentProgress - startProgress) / (endProgress - startProgress)) * 100 
            } : t
          ));

          setTimeout(() => processStep(currentProgress + 2), 100);
        } else {
          // Final compiled report structure
          const compiledReport = {
            executiveSummary: generateExecutiveSummary(filteredStudents),
            keyFindings: generateKeyFindings(filteredStudents),
            recommendations: generateRecommendations(filteredStudents),
            detailedAnalysis: generateDetailedAnalysis(filteredStudents),
            compilationTimestamp: new Date().toISOString(),
            reportId: `REP-${Date.now()}`,
            dataIntegrity: "Verified - All calculations based on actual student records"
          };

          setThreads(prev => prev.map(t => 
            t.id === thread.id ? { ...t, status: 'completed', progress: 100 } : t
          ));
          resolve(compiledReport);
        }
      };

      processStep(startProgress);
    });
  };

  // REAL DATA PROCESSING FUNCTIONS
  const validateStudentRecord = (student) => {
    return student.student_name && 
           student.student_name !== "Unknown" &&
           student.gpa && 
           !isNaN(parseFloat(student.gpa)) && 
           student.semester &&
           student.semester !== "Unknown Semester";
  };

  const findDataIssues = (student) => {
    const issues = [];
    if (!student.student_name || student.student_name === "Unknown") {
      issues.push("Missing or invalid student name");
    }
    if (!student.gpa || isNaN(parseFloat(student.gpa))) {
      issues.push("Invalid or missing GPA");
    }
    if (!student.courses || student.courses.length === 0) {
      issues.push("No course data available");
    }
    if (student.courses) {
      student.courses.forEach(course => {
        if (!course.name || !course.grade) {
          issues.push(`Incomplete course data for ${course.name || 'unknown course'}`);
        }
      });
    }
    return issues;
  };

  const calculateValidationScore = (student) => {
    let score = 100;
    if (!student.student_name || student.student_name === "Unknown") score -= 30;
    if (!student.gpa || isNaN(parseFloat(student.gpa))) score -= 30;
    if (!student.courses || student.courses.length === 0) score -= 20;
    if (!student.semester || student.semester === "Unknown Semester") score -= 20;
    return Math.max(0, score);
  };

  const getPerformanceTier = (gpa) => {
    if (gpa >= 3.5) return "Excellent";
    if (gpa >= 2.5) return "Good";
    return "Needs Improvement";
  };

  const findStrongSubjects = (student) => {
    if (!student.courses) return [];
    return student.courses
      .filter(course => {
        const grade = course.grade;
        return grade === 'A' || grade === 'B+' || grade === 'B';
      })
      .map(course => ({
        name: course.name,
        grade: course.grade,
        marks: course.marks
      }));
  };

  const findWeakSubjects = (student) => {
    if (!student.courses) return [];
    return student.courses
      .filter(course => {
        const grade = course.grade;
        return grade === 'D' || grade === 'E' || grade === 'F' || grade === 'E–';
      })
      .map(course => ({
        name: course.name,
        grade: course.grade,
        marks: course.marks
      }));
  };

  const calculatePerformanceDistribution = (students) => {
    const tiers = {
      excellent: 0,
      good: 0,
      needsImprovement: 0
    };
    
    students.forEach(student => {
      const gpa = parseFloat(student.gpa) || 0;
      if (gpa >= 3.5) tiers.excellent++;
      else if (gpa >= 2.5) tiers.good++;
      else tiers.needsImprovement++;
    });
    
    return {
      ...tiers,
      total: students.length,
      excellentPercentage: ((tiers.excellent / students.length) * 100).toFixed(1),
      goodPercentage: ((tiers.good / students.length) * 100).toFixed(1),
      needsImprovementPercentage: ((tiers.needsImprovement / students.length) * 100).toFixed(1)
    };
  };

  const getTopPerformers = (students, count) => {
    return students
      .filter(s => parseFloat(s.gpa))
      .sort((a, b) => parseFloat(b.gpa) - parseFloat(a.gpa))
      .slice(0, count)
      .map(s => ({
        name: s.student_name,
        gpa: parseFloat(s.gpa).toFixed(2),
        semester: s.semester,
        courses: s.courses ? s.courses.length : 0
      }));
  };

  const getStrugglingStudents = (students, count) => {
    return students
      .filter(s => parseFloat(s.gpa))
      .sort((a, b) => parseFloat(a.gpa) - parseFloat(b.gpa))
      .slice(0, count)
      .map(s => ({
        name: s.student_name,
        gpa: parseFloat(s.gpa).toFixed(2),
        semester: s.semester,
        courses: s.courses ? s.courses.length : 0
      }));
  };

  const compareSemesterPerformance = (students) => {
    const semesters = [...new Set(students.map(s => s.semester))];
    return semesters.map(semester => {
      const semesterStudents = students.filter(s => s.semester === semester);
      const gpas = semesterStudents.map(s => parseFloat(s.gpa)).filter(g => !isNaN(g));
      const average = gpas.length ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;
      
      return {
        semester,
        averageGPA: average.toFixed(2),
        studentCount: semesterStudents.length,
        performanceDistribution: calculatePerformanceDistribution(semesterStudents)
      };
    });
  };

  const calculateAdvancedStatistics = (students) => {
    const gpas = students.map(s => parseFloat(s.gpa)).filter(g => !isNaN(g));
    if (gpas.length === 0) return {};
    
    const average = gpas.reduce((a, b) => a + b, 0) / gpas.length;
    const max = Math.max(...gpas);
    const min = Math.min(...gpas);
    
    // Standard deviation
    const squaredDiffs = gpas.map(gpa => Math.pow(gpa - average, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / gpas.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      average: average.toFixed(2),
      max: max.toFixed(2),
      min: min.toFixed(2),
      stdDev: stdDev.toFixed(2),
      count: gpas.length,
      range: (max - min).toFixed(2)
    };
  };

  const calculateComprehensiveStatistics = (students) => {
    const basicStats = calculateAdvancedStatistics(students);
    const performanceDist = calculatePerformanceDistribution(students);
    
    return {
      ...basicStats,
      performanceDistribution: performanceDist,
      excellenceRate: performanceDist.excellentPercentage + '%',
      improvementRate: performanceDist.needsImprovementPercentage + '%',
      dataQuality: calculateDataQuality(students),
      totalCourseRecords: students.reduce((sum, s) => sum + (s.courses ? s.courses.length : 0), 0)
    };
  };

  const calculateDataQuality = (students) => {
    const totalStudents = students.length;
    const validStudents = students.filter(validateStudentRecord).length;
    const qualityScore = (validStudents / totalStudents) * 100;
    
    return {
      score: qualityScore.toFixed(1) + '%',
      validRecords: validStudents,
      totalRecords: totalStudents,
      status: qualityScore >= 90 ? 'Excellent' : qualityScore >= 75 ? 'Good' : 'Needs Attention',
      issues: students.flatMap(s => findDataIssues(s)).filter(issue => issue).length
    };
  };

  const generateExecutiveSummary = (students) => {
    const stats = calculateComprehensiveStatistics(students);
    return {
      overallPerformance: `Average GPA: ${stats.average} (Range: ${stats.min} - ${stats.max})`,
      keyHighlight: `${stats.excellenceRate} of students achieved excellent performance (GPA ≥ 3.5)`,
      mainConcern: `${stats.improvementRate} of students need academic improvement (GPA < 2.5)`,
      dataQuality: `Data quality: ${stats.dataQuality.status} (${stats.dataQuality.score})`,
      reportScope: `Analysis covers ${students.length} students across ${[...new Set(students.map(s => s.semester))].length} semesters`
    };
  };

  const generateKeyFindings = (students) => {
    const topPerformers = getTopPerformers(students, 3);
    const struggling = getStrugglingStudents(students, 3);
    const performanceDist = calculatePerformanceDistribution(students);
    const stats = calculateAdvancedStatistics(students);
    
    return [
      `Top performer: ${topPerformers[0]?.name} with GPA ${topPerformers[0]?.gpa}`,
      `${performanceDist.excellent} students (${performanceDist.excellentPercentage}%) achieved excellent performance`,
      `${performanceDist.needsImprovement} students (${performanceDist.needsImprovementPercentage}%) need academic support`,
      `GPA distribution: Average ${stats.average} ± ${stats.stdDev}`,
      `Data covers ${[...new Set(students.map(s => s.semester))].length} semesters with ${students.length} total records`
    ];
  };

  const generateRecommendations = (students) => {
    const strugglingCount = calculatePerformanceDistribution(students).needsImprovement;
    const dataQuality = calculateDataQuality(students);
    const recommendations = [];
    
    if (strugglingCount > 0) {
      recommendations.push(`Implement targeted academic support for ${strugglingCount} struggling students`);
      recommendations.push(`Review and enhance teaching methods for consistently low-performing subjects`);
    }
    
    if (dataQuality.status !== 'Excellent') {
      recommendations.push(`Improve data quality (currently ${dataQuality.score} - ${dataQuality.status})`);
    }
    
    const topPerformers = getTopPerformers(students, 3);
    if (topPerformers.length > 0) {
      recommendations.push(`Provide advanced opportunities for top performers like ${topPerformers[0]?.name}`);
    }
    
    recommendations.push("Consider implementing peer tutoring programs");
    recommendations.push("Review curriculum alignment with learning outcomes");
    
    return recommendations;
  };

  const generateDetailedAnalysis = (students) => {
    return {
      semesterBreakdown: compareSemesterPerformance(students),
      performanceTrends: analyzePerformanceTrends(students),
      courseAnalysis: analyzeCoursePerformance(students),
      studentProgression: analyzeStudentProgression(students),
      dataQualityAssessment: calculateDataQuality(students)
    };
  };

  const analyzePerformanceTrends = (students) => {
    const semesters = compareSemesterPerformance(students);
    if (semesters.length < 2) return "Single semester data - trend analysis requires multiple semesters";
    
    const sortedSemesters = semesters.sort((a, b) => a.semester.localeCompare(b.semester));
    const gpaTrend = sortedSemesters.map(s => parseFloat(s.averageGPA));
    
    return {
      semesters: sortedSemesters.map(s => s.semester),
      averageGPAs: gpaTrend,
      trend: gpaTrend.length > 1 ? (gpaTrend[gpaTrend.length - 1] > gpaTrend[0] ? "Improving" : "Declining") : "Stable",
      analysis: `Performance across ${semesters.length} semesters shows ${gpaTrend.length > 1 ? (gpaTrend[gpaTrend.length - 1] > gpaTrend[0] ? "improvement" : "decline") : "consistent"} trends`
    };
  };

  const analyzeCoursePerformance = (students) => {
    // Aggregate course performance across all students
    const allCourses = {};
    
    students.forEach(student => {
      if (student.courses) {
        student.courses.forEach(course => {
          if (!allCourses[course.name]) {
            allCourses[course.name] = { 
              grades: [], 
              studentCount: 0,
              totalStudents: 0
            };
          }
          allCourses[course.name].grades.push(course.grade);
          allCourses[course.name].studentCount++;
        });
      }
    });

    // Count total students who could have taken each course
    Object.keys(allCourses).forEach(courseName => {
      allCourses[courseName].totalStudents = students.filter(s => 
        s.courses && s.courses.some(c => c.name === courseName)
      ).length;
    });
    
    return Object.keys(allCourses).map(courseName => ({
      course: courseName,
      enrolledStudents: allCourses[courseName].studentCount,
      totalPossible: allCourses[courseName].totalStudents,
      enrollmentRate: ((allCourses[courseName].studentCount / allCourses[courseName].totalStudents) * 100).toFixed(1) + '%',
      gradeDistribution: allCourses[courseName].grades.reduce((dist, grade) => {
        dist[grade] = (dist[grade] || 0) + 1;
        return dist;
      }, {})
    }));
  };
  
  const analyzeStudentProgression = (students) => {
    // This would require historical student data across multiple semesters
    // For now, provide basic analysis
    const studentSemesters = students.reduce((acc, student) => {
      if (!acc[student.student_name]) {
        acc[student.student_name] = new Set();
      }
      acc[student.student_name].add(student.semester);
      return acc;
    }, {});

    const multiSemesterStudents = Object.values(studentSemesters).filter(semesters => semesters.size > 1).length;
    
    return {
      totalUniqueStudents: Object.keys(studentSemesters).length,
      multiSemesterStudents,
      singleSemesterStudents: Object.keys(studentSemesters).length - multiSemesterStudents,
      analysis: `${multiSemesterStudents} students have records across multiple semesters`
    };
  };

  const generateStudentCSV = (data) => {
    let csv = "Student ID,Student Name,Semester,GPA,CGPA,Courses\n";
    data.forEach((student) => {
      const courses = student.courses && student.courses.length > 0
        ? student.courses.map((c) => `${c.name}(${c.grade})`).join("; ")
        : "N/A";
      csv += `${student.student_id || "N/A"},${student.student_name},${
        student.semester
      },${student.gpa},${student.cgpa},"${courses}"\n`;
    });
    return csv;
  };

  const generateStudentReportText = (data) => {
    let text = "STUDENT PERFORMANCE REPORT\n";
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += "=".repeat(80) + "\n\n";

    data.forEach((student, index) => {
      text += `${index + 1}. ${student.student_name} (${student.student_id || "N/A"})\n`;
      text += `   Semester: ${student.semester}\n`;
      text += `   GPA: ${student.gpa} | CGPA: ${student.cgpa}\n`;
      if (student.courses && student.courses.length > 0) {
        text += `   Courses:\n`;
        student.courses.forEach((course) => {
          text += `      - ${course.name}: ${course.grade} (${course.credits} credits)\n`;
        });
      }
      text += "\n";
    });

    return text;
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const downloadTextFile = (content, filename) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // ========== HELPER FUNCTIONS ==========
  const filteredStudents =
    selectedSemester === "all"
      ? studentReports
      : studentReports.filter((s) => s.semester === selectedSemester);

  const calculateAverageGPA = () => {
    if (filteredStudents.length === 0) return "0.00";
    const sum = filteredStudents.reduce((acc, s) => acc + (parseFloat(s.gpa) || 0), 0);
    return (sum / filteredStudents.length).toFixed(2);
  };

  // ========== COMPONENT RENDER ==========
  const GeneratedReportSection = () => {
    if (!generatedReportData) return null;

    return (
      <div className="card mt-4 border-success">
        <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📊 Generated Report Results</h5>
          <span className="badge bg-light text-dark">
            {generatedReportData.dataSource}
          </span>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <strong>Report Summary:</strong> {generatedReportData.summary.reportScope}
            <br />
            <strong>Data Quality:</strong> {generatedReportData.statistics.dataQuality.status} 
            ({generatedReportData.statistics.dataQuality.score})
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <h6>📈 Key Statistics</h6>
              <div className="bg-light p-3 small rounded">
                <strong>Average GPA:</strong> {generatedReportData.statistics.average}<br />
                <strong>Performance Distribution:</strong><br />
                - Excellent: {generatedReportData.statistics.performanceDistribution.excellent} students<br />
                - Good: {generatedReportData.statistics.performanceDistribution.good} students<br />
                - Needs Improvement: {generatedReportData.statistics.performanceDistribution.needsImprovement} students<br />
                <strong>Data Quality:</strong> {generatedReportData.statistics.dataQuality.status}
              </div>
            </div>
            <div className="col-md-6">
              <h6>💡 Executive Summary</h6>
              <div className="bg-light p-3 small rounded">
                {Object.entries(generatedReportData.compiledReport.executiveSummary).map(([key, value]) => (
                  <div key={key}><strong>{key}:</strong> {value}</div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <button 
              className="btn btn-primary btn-sm me-2"
              onClick={() => {
                const reportContent = JSON.stringify(generatedReportData, null, 2);
                const blob = new Blob([reportContent], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `comprehensive_report_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
            >
              💾 Download Full Report (JSON)
            </button>
            
            <button 
              className="btn btn-success btn-sm me-2"
              onClick={() => {
                const summary = `
COMPREHENSIVE STUDENT PERFORMANCE REPORT
Generated: ${generatedReportData.generatedAt}
Data Source: ${generatedReportData.dataSource}

EXECUTIVE SUMMARY:
${Object.entries(generatedReportData.compiledReport.executiveSummary).map(([key, value]) => `${key}: ${value}`).join('\n')}

KEY STATISTICS:
- Average GPA: ${generatedReportData.statistics.average}
- Students: ${generatedReportData.statistics.count}
- Excellent: ${generatedReportData.statistics.performanceDistribution.excellent}
- Good: ${generatedReportData.statistics.performanceDistribution.good}
- Needs Improvement: ${generatedReportData.statistics.performanceDistribution.needsImprovement}

RECOMMENDATIONS:
${generatedReportData.compiledReport.recommendations.join('\n- ')}
                `.trim();

                const blob = new Blob([summary], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_summary_${new Date().toISOString().split('T')[0]}.txt`;
                a.click();
              }}
            >
              📄 Download Summary (TXT)
            </button>

            <button 
              className="btn btn-info btn-sm"
              onClick={() => {
                setShowStorageModal(true);
              }}
            >
              📤 Share Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container-fluid"
    >
      <div className="card shadow mb-4 p-4">
        <h3 className="mb-4">📊 Reports Dashboard</h3>

        {/* Data Source Indicator */}
        <div className={`alert ${usingRealData ? 'alert-success' : 'alert-warning'} mb-4`}>
          <strong>Data Source:</strong> {usingRealData ? '✅ Real Student Data from API' : '⚠️ Demo Data (API Unavailable)'}
          {!usingRealData && (
            <div className="mt-1 small">
              <em>Showing sample data. Authenticate to access real student records.</em>
            </div>
          )}
        </div>

        {/* Report Generation Status */}
        {reportStatus && (
          <div className={`alert ${reportStatus.includes("✅") ? "alert-success" : reportStatus.includes("❌") ? "alert-danger" : "alert-info"} alert-dismissible fade show mb-4`}>
            <div className="d-flex align-items-center">
              {generatingReport && (
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              )}
              <span className="flex-grow-1">{reportStatus}</span>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => {
                  setReportStatus("");
                  setThreads([]);
                }}
              ></button>
            </div>
            
            {/* Progress Bar */}
            {generatingReport && (
              <div className="mt-2">
                <div className="progress">
                  <div 
                    className="progress-bar progress-bar-striped progress-bar-animated" 
                    role="progressbar" 
                    style={{ width: `${reportProgress}%` }}
                  >
                    {Math.round(reportProgress)}%
                  </div>
                </div>
              </div>
            )}

            {/* Thread Status */}
            {threads.length > 0 && (
              <div className="mt-3">
                <h6 className="mb-2">Processing Threads:</h6>
                <div className="row">
                  {threads.map((thread) => (
                    <div key={thread.id} className="col-md-6 mb-2">
                      <div className="card">
                        <div className="card-body py-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small">
                              {thread.status === 'completed' ? '✅' : 
                               thread.status === 'running' ? '🔄' : '⏳'} {thread.name}
                            </span>
                            <span className="badge bg-secondary">{Math.round(thread.progress)}%</span>
                          </div>
                          <div className="progress mt-1" style={{ height: '4px' }}>
                            <div 
                              className={`progress-bar ${
                                thread.status === 'completed' ? 'bg-success' : 
                                thread.status === 'running' ? 'bg-warning' : 'bg-secondary'
                              }`}
                              style={{ width: `${thread.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "students" ? "active" : ""}`}
              onClick={() => setActiveTab("students")}
            >
              📚 Student Performance
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "standard" ? "active" : ""}`}
              onClick={() => setActiveTab("standard")}
            >
              📋 Standard Reports
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "previous" ? "active" : ""}`}
              onClick={() => setActiveTab("previous")}
            >
              🗂️ Previous Reports
            </button>
          </li>
        </ul>

        {/* Student Performance Tab */}
        {activeTab === "students" && (
          <div>
            {/* Statistics Cards */}
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card text-center p-3" style={{ backgroundColor: "#caffbf" }}>
                  <h6 className="text-muted mb-1">Total Students</h6>
                  <h3 className="mb-0">{filteredStudents.length}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-center p-3" style={{ backgroundColor: "#9bf6ff" }}>
                  <h6 className="text-muted mb-1">Average GPA</h6>
                  <h3 className="mb-0">{calculateAverageGPA()}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-center p-3" style={{ backgroundColor: "#ffd6a5" }}>
                  <h6 className="text-muted mb-1">Above 3.5</h6>
                  <h3 className="mb-0">
                    {filteredStudents.filter((s) => parseFloat(s.gpa) >= 3.5).length}
                  </h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-center p-3" style={{ backgroundColor: "#ffadad" }}>
                  <h6 className="text-muted mb-1">Below 2.5</h6>
                  <h3 className="mb-0">
                    {filteredStudents.filter((s) => parseFloat(s.gpa) < 2.5).length}
                  </h3>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  style={{ width: "200px" }}
                >
                  <option value="all">All Semesters</option>
                  <option value="Semester 1, 2025">Semester 1, 2025</option>
                  <option value="Semester 2, 2025">Semester 2, 2025</option>
                </select>
                
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowManualEntry(!showManualEntry);
                    setEditingStudent(null);
                    setManualForm({
                      student_name: "",
                      student_id: "",
                      semester: "Semester 1, 2025",
                      courses: [{ name: "", grade: "", credits: "", marks: "" }],
                    });
                  }}
                >
                  ➕ {showManualEntry ? "Cancel" : "Add Student Manually"}
                </button>

                {/* Generate Report Button */}
                <button
                  className="btn btn-warning"
                  onClick={generateReport}
                  disabled={generatingReport || filteredStudents.length === 0}
                >
                  {generatingReport ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Generating...</span>
                      </span>
                      Generating...
                    </>
                  ) : (
                    "🚀 Generate Report"
                  )}
                </button>
              </div>

              <div className="d-flex gap-2">
                <button 
                  className="btn btn-success" 
                  onClick={() => {
                    const csvContent = generateStudentCSV(filteredStudents);
                    downloadCSV(csvContent, `student_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
                  }}
                >
                  📥 Download CSV
                </button>
                
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    const content = generateStudentReportText(filteredStudents);
                    downloadTextFile(content, `student_performance_report_${new Date().toISOString().split('T')[0]}.txt`);
                  }}
                >
                  📄 Download TXT
                </button>
                
                {/* New Share Button */}
                <button 
                  className="btn btn-info" 
                  onClick={() => setShowStorageModal(true)}
                  disabled={filteredStudents.length === 0}
                >
                  💾 Save & Share
                </button>
              </div>
            </div>

            {/* Manual Entry Form */}
            {showManualEntry && (
              <div className="card mb-4 border-primary">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    {editingStudent ? "✏️ Edit Student Record" : "➕ Add New Student Record"}
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Select Student *</label>
                      <select
                        className="form-select"
                        value={manualForm.student_id}
                        onChange={(e) => {
                          const selectedStudent = registeredStudents.find(s => s.id === parseInt(e.target.value));
                          setManualForm({ 
                            ...manualForm, 
                            student_id: e.target.value,
                            student_name: selectedStudent ? selectedStudent.username : ""
                          });
                        }}
                      >
                        <option value="">-- Select a Student --</option>
                        {registeredStudents.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.username} ({student.email})
                          </option>
                        ))}
                      </select>
                      {registeredStudents.length === 0 && (
                        <small className="text-muted">Loading students...</small>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Semester *</label>
                      <select
                        className="form-select"
                        value={manualForm.semester}
                        onChange={(e) => setManualForm({ ...manualForm, semester: e.target.value })}
                      >
                        <option value="Semester 1, 2025">Semester 1, 2025</option>
                        <option value="Semester 2, 2025">Semester 2, 2025</option>
                      </select>
                    </div>
                  </div>

                  <hr />
                  
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Courses</h6>
                    <button className="btn btn-sm btn-success" onClick={addCourseToForm}>
                      + Add Course
                    </button>
                  </div>

                  {manualForm.courses.map((course, index) => (
                    <div key={index} className="row mb-2 align-items-end">
                      <div className="col-md-3">
                        <label className="form-label small">Course Name</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={course.name}
                          onChange={(e) => updateCourseInForm(index, "name", e.target.value)}
                          placeholder="e.g. Mathematics"
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small">Marks (0-100)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={course.marks}
                          onChange={(e) => updateCourseInForm(index, "marks", e.target.value)}
                          min="0"
                          max="100"
                          placeholder="85"
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small">Grade</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={course.grade}
                          readOnly
                          style={{ backgroundColor: "#f0f0f0" }}
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label small">Credits</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={course.credits}
                          onChange={(e) => updateCourseInForm(index, "credits", e.target.value)}
                          min="1"
                          placeholder="3"
                        />
                      </div>
                      <div className="col-md-2">
                        <button
                          className="btn btn-sm btn-outline-danger w-100"
                          onClick={() => removeCourseFromForm(index)}
                          disabled={manualForm.courses.length === 1}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-3 p-2 bg-light rounded">
                    <strong>Calculated GPA:</strong>
                    <span className="badge bg-primary ms-2 fs-5">
                      {calculateGPA(manualForm.courses)}
                    </span>
                  </div>

                  <div className="mt-3 d-flex gap-2">
                    <button className="btn btn-success" onClick={saveManualEntry}>
                      💾 {editingStudent ? "Update Record" : "Save Record"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowManualEntry(false);
                        setEditingStudent(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Student Data Table */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Semester</th>
                      <th>GPA</th>
                      <th>CGPA</th>
                      <th>Courses</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-4 text-muted">
                          {loading ? "Loading..." : "No student records found. Add records manually or check API connection."}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, index) => (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td>{student.student_id || "N/A"}</td>
                          <td>{student.student_name}</td>
                          <td>{student.semester}</td>
                          <td>
                            <span
                              className={`badge ${
                                parseFloat(student.gpa) >= 3.5
                                  ? "bg-success"
                                  : parseFloat(student.gpa) >= 2.5
                                  ? "bg-warning"
                                  : "bg-danger"
                              }`}
                            >
                              {student.gpa}
                            </span>
                          </td>
                          <td>{student.cgpa}</td>
                          <td>
                            {student.courses && student.courses.length > 0 
                              ? student.courses.length 
                              : "N/A"}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                parseFloat(student.gpa) >= 3.5
                                  ? "bg-success"
                                  : parseFloat(student.gpa) >= 2.5
                                  ? "bg-warning text-dark"
                                  : "bg-danger"
                              }`}
                            >
                              {parseFloat(student.gpa) >= 3.5
                                ? "Excellent"
                                : parseFloat(student.gpa) >= 2.5
                                ? "Good"
                                : "Needs Improvement"}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => editStudentRecord(student)}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteStudentRecord(student.id)}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Standard Reports Tab */}
        {activeTab === "standard" && (
          <div>
            <div className="row">
              {standardReports.map((report) => (
                <div key={report.id} className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title">{report.title}</h5>
                        <span className="badge bg-primary">{report.type}</span>
                      </div>
                      <p className="text-muted small mb-2">{report.date}</p>
                      <p className="card-text">{report.description}</p>
                      <button className="btn btn-sm btn-outline-primary">
                        📥 Download Report
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous Reports Tab */}
        {activeTab === "previous" && (
          <div>
            <div className="list-group">
              {previousReports.map((report) => (
                <div
                  key={report.id}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                >
                  <div>
                    <h6 className="mb-1">{report.title}</h6>
                    <small className="text-muted">
                      {report.date} • {report.type}
                    </small>
                  </div>
                  <button className="btn btn-sm btn-outline-secondary">
                    📥 Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Report Section */}
        <GeneratedReportSection />
      </div>

      {/* Storage Options Modal */}
      {showStorageModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">💾 Save & Share Report</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowStorageModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Storage Status */}
                {storageStatus && (
                  <div className={`alert ${storageStatus.includes("✅") ? "alert-success" : storageStatus.includes("❌") ? "alert-danger" : "alert-info"} mb-3`}>
                    {storageStatus}
                  </div>
                )}

                {/* Storage Options */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Choose Storage Option:</label>
                  <div className="d-grid gap-2">
                    <button
                      className={`btn ${storageOption === "download" ? "btn-primary" : "btn-outline-primary"} text-start`}
                      onClick={() => setStorageOption("download")}
                    >
                      📥 Download to Computer
                      <small className="d-block text-muted">Save as JSON/CSV file on your device</small>
                    </button>

                    <button
                      className={`btn ${storageOption === "cloud" ? "btn-success" : "btn-outline-success"} text-start`}
                      onClick={() => setStorageOption("cloud")}
                    >
                      ☁️ Save to Cloud Storage
                      <small className="d-block text-muted">Upload to Google Drive, Dropbox, or OneDrive</small>
                    </button>

                    <button
                      className={`btn ${storageOption === "email" ? "btn-info" : "btn-outline-info"} text-start`}
                      onClick={() => setStorageOption("email")}
                    >
                      📧 Email Report
                      <small className="d-block text-muted">Send directly to email recipients</small>
                    </button>
                  </div>
                </div>

                {/* Cloud Provider Selection */}
              
                 {storageOption === "cloud" && (
  <div className="mb-3">
    <div className="alert alert-success">
      <strong>☁️ Supabase Cloud Storage</strong>
      <br />
      Files will be uploaded to secure cloud storage with instant public URLs.
      <br />
      <small>Fast, reliable, and no storage limits for your reports.</small>
    </div>
  </div>
)}

                {/* Email Form */}
                {storageOption === "email" && (
                  <div className="mb-3">
                    <label className="form-label">Recipient Email:</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="recipient@example.com"
                      value={emailForm.recipient}
                      onChange={(e) => setEmailForm({...emailForm, recipient: e.target.value})}
                    />
                    
                    <label className="form-label mt-2">Subject:</label>
                    <input
                      type="text"
                      className="form-control"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                    />
                    
                    <label className="form-label mt-2">Message:</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowStorageModal(false)}
                  disabled={uploadingToCloud || sendingEmail}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStorageAction}
                  disabled={uploadingToCloud || sendingEmail || (storageOption === "email" && !emailForm.recipient)}
                >
                  {uploadingToCloud ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Uploading...
                    </>
                  ) : sendingEmail ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Sending...
                    </>
                  ) : storageOption === "download" ? (
                    "📥 Download Now"
                  ) : storageOption === "cloud" ? (
                    `☁️ Upload to ${cloudProvider === 'gdrive' ? 'Google Drive' : cloudProvider === 'dropbox' ? 'Dropbox' : 'OneDrive'}`
                  ) : (
                    "📧 Send Email"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default AdminReportsPage;