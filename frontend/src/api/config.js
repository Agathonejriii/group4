// frontend/src/api/config.js
// API Configuration for React Frontend

// Get the base API URL based on environment
const getBaseURL = () => {
  if (import.meta.env.PROD) {
    // For Render or any deployed environment
    return `${window.location.origin}`;
  }
  // For local development
  return 'http://127.0.0.1:8000';
};

export const API_BASE_URL = getBaseURL();

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  login: '/api/accounts/login/',
  logout: '/api/accounts/logout/',
  register: '/api/accounts/register/',
  profile: '/api/accounts/me/',
  users: '/api/accounts/all-users/',
  
  // Student endpoints
  students: '/api/accounts/students/',
  peers: '/api/students/peers/',
  gpaRecords: '/api/accounts/gpa-records/',
  studentDetail: (id) => `/api/students/${id}/`,
  
  // Report endpoints
  generateReport: '/api/students/generate-report/',
  reportStatus: (taskId) => `/api/students/report-status/${taskId}/`,
  reports: '/api/students/reports/',
  downloadReport: (taskId) => `/api/students/reports/${taskId}/download/`,
};

// Token management
export const setToken = (token) => {
  localStorage.setItem("token", token);
  localStorage.setItem("accessToken", token); // Keep both for compatibility
};

export const getToken = () => {
  return localStorage.getItem("token") || localStorage.getItem("accessToken");
};

export const removeToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("jwtToken");
};

// Generic API request function with proper error handling
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`🔄 API Request: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
      throw new Error('Authentication failed. Please login again.');
    }
    
    // Handle 403 Forbidden
    if (response.status === 403) {
      throw new Error(`Permission denied: You don't have access to this resource`);
    }
    
    // Handle other error statuses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // Parse successful response
    const data = await response.json();
    console.log(`✅ API Success: ${endpoint}`, data);
    return data;
  } catch (error) {
    console.error(`❌ API Request Error (${endpoint}):`, error);
    
    // Network errors
    if (error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection and ensure the server is running.');
    }
    
    throw error;
  }
};

// Auth functions
export const loginUser = async (username, password) => {
  try {
    const response = await apiRequest(API_ENDPOINTS.login, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    
    if (response.access) {
      setToken(response.access);
    }
    
    return response;
  } catch (error) {
    throw new Error(error.message || 'Login failed. Please check your credentials.');
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await apiRequest(API_ENDPOINTS.register, {
      method: "POST",
      body: JSON.stringify(userData),
    });
    
    return response;
  } catch (error) {
    throw new Error(error.message || 'Registration failed. Please try again.');
  }
};

export const logoutUser = async () => {
  try {
    await apiRequest(API_ENDPOINTS.logout, {
      method: "POST",
    });
    removeToken();
  } catch (error) {
    // Even if logout fails on server, remove token locally
    removeToken();
    throw error;
  }
};

export const fetchCurrentUser = async () => {
  try {
    return await apiRequest(API_ENDPOINTS.profile);
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch user profile.');
  }
};

export const fetchUsers = async () => {
  try {
    return await apiRequest(API_ENDPOINTS.users);
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch users.');
  }
};

// Student API functions
export const studentAPI = {
  // Get all students
  getStudents: async () => {
    try {
      return await apiRequest(API_ENDPOINTS.students);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch students.');
    }
  },

  // Get GPA records
  getGPARecords: async () => {
    try {
      return await apiRequest(API_ENDPOINTS.gpaRecords);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch GPA records.');
    }
  },
  
  // Get peer students
  getPeerStudents: async () => {
    try {
      return await apiRequest(API_ENDPOINTS.peers);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch peer students.');
    }
  },

  // Get student detail
  getStudentDetail: async (id) => {
    try {
      return await apiRequest(API_ENDPOINTS.studentDetail(id));
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch student details.');
    }
  },

  // Generate report
  generateReport: async (studentId, reportType = 'comprehensive') => {
    try {
      return await apiRequest(API_ENDPOINTS.generateReport, {
        method: 'POST',
        body: JSON.stringify({ 
          student_id: studentId, 
          report_type: reportType 
        }),
      });
    } catch (error) {
      throw new Error(error.message || 'Failed to generate report.');
    }
  },

  // Get report status
  getReportStatus: async (taskId) => {
    try {
      return await apiRequest(API_ENDPOINTS.reportStatus(taskId));
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch report status.');
    }
  },

  // Get all reports
  getReports: async () => {
    try {
      return await apiRequest(API_ENDPOINTS.reports);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch reports.');
    }
  },

  // Download report
  downloadReport: async (taskId) => {
    try {
      const response = await apiRequest(API_ENDPOINTS.downloadReport(taskId));
      
      // Create downloadable JSON file
      const content = JSON.stringify(response, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student-report-${taskId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to download report.');
    }
  },

  // Poll report status with callbacks
  pollReportStatus: async (taskId, onProgress, onComplete, onError, interval = 2000) => {
    const poll = async () => {
      try {
        const status = await studentAPI.getReportStatus(taskId);
        
        // Call progress callback
        if (onProgress) {
          onProgress(status);
        }

        // Check if completed
        if (status.status === 'completed') {
          if (onComplete) onComplete(status);
          return true;
        } 
        // Check if failed
        else if (status.status === 'failed') {
          if (onError) onError(status.error || 'Report generation failed');
          return true;
        } 
        // Continue polling
        else {
          setTimeout(poll, interval);
        }
      } catch (error) {
        if (onError) onError(error.message);
        return true;
      }
    };

    poll();
  },
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Export default apiRequest for custom requests
export default apiRequest;