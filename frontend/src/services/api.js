const API_BASE_URL = "http://127.0.0.1:8000";

// Save token to localStorage
export const setToken = (token) => localStorage.setItem("token", token);

// Get token from localStorage
export const getToken = () => localStorage.getItem("token") || localStorage.getItem("accessToken");

// Remove token
export const removeToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`🔄 API Request: ${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }
    
    if (response.status === 403) {
      throw new Error(`Permission denied: You don't have access to this resource`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Success: ${endpoint}`, data);
    return data;
  } catch (error) {
    console.error(`❌ API Request Error (${endpoint}):`, error);
    throw error;
  }
};

// Polling function for threaded tasks
const pollReportStatus = async (taskId, onProgress, onComplete, onError, interval = 2000) => {
  const poll = async () => {
    try {
      const status = await studentAPI.getReportStatus(taskId);
      
      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed') {
        if (onComplete) onComplete(status);
        return true;
      } else if (status.status === 'failed') {
        if (onError) onError(status.error);
        return true;
      } else {
        // Continue polling
        setTimeout(poll, interval);
      }
    } catch (error) {
      if (onError) onError(error.message);
      return true;
    }
  };

  poll();
};

// Student endpoints - REAL IMPLEMENTATION ONLY
export const studentAPI = {
  // Reports - Real implementation only
  generateReport: async (studentId, reportType = 'comprehensive') => {
    return await apiRequest('/api/students/generate-report/', {
      method: 'POST',
      body: JSON.stringify({ 
        student_id: studentId, 
        report_type: reportType 
      }),
    });
  },

  getReportStatus: async (taskId) => {
    return await apiRequest(`/api/students/report-status/${taskId}/`);
  },

  getReports: async () => {
    return await apiRequest('/api/students/reports/');
  },

  downloadReport: async (reportId) => {
    const response = await apiRequest(`/api/students/reports/${reportId}/download/`);
    
    // Create downloadable JSON file
    const content = JSON.stringify(response, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student-report-${reportId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Polling function for threaded tasks
  pollReportStatus: async (taskId, onProgress, onComplete, onError, interval = 2000) => {
    const poll = async () => {
      try {
        const status = await studentAPI.getReportStatus(taskId);
        
        if (onProgress) {
          onProgress(status);
        }

        if (status.status === 'completed') {
          if (onComplete) onComplete(status);
          return true;
        } else if (status.status === 'failed') {
          if (onError) onError(status.error);
          return true;
        } else {
          // Continue polling
          setTimeout(poll, interval);
        }
      } catch (error) {
        if (onError) onError(error.message);
        return true;
      }
    };

    poll();
  },

  // Student data
  getStudents: async () => {
    return await apiRequest('/api/accounts/students/');
  },

  getGPARecords: () => apiRequest('/api/accounts/gpa-records/'),
  
  getPeerStudents: async () => {
  return await apiRequest('/api/students/peers/');
},
};

export default apiRequest;