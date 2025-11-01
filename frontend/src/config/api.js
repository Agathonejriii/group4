// API Configuration for React Frontend

// Get the base API URL based on environment
const getBaseURL = () => {
  // In production (deployed on Render)
  if (import.meta.env.PROD) {
    return window.location.origin; // Same domain as frontend
  }
  
  // In development (local)
  return 'http://localhost:8000';
};

export const API_BASE_URL = getBaseURL();

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  login: '/api/accounts/login/',
  logout: '/api/accounts/logout/',
  register: '/api/accounts/register/',
  profile: '/api/accounts/profile/',
  
  // Student endpoints
  students: '/api/students/',
  studentDetail: (id) => `/api/students/${id}/`,
  
  // Add more endpoints as needed
};

// Helper function for API calls with error handling
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session auth
  };

  // Get CSRF token from cookie if it exists
  const csrfToken = getCookie('csrftoken');
  if (csrfToken && options.method !== 'GET') {
    defaultOptions.headers['X-CSRFToken'] = csrfToken;
  }

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: errorData.message || response.statusText,
        data: errorData,
      };
    }

    // Return parsed JSON
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Helper to get CSRF token from cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Example usage in your components:
/*
import { apiCall, API_ENDPOINTS } from './config/api';

// GET request
const students = await apiCall(API_ENDPOINTS.students);

// POST request
const newStudent = await apiCall(API_ENDPOINTS.students, {
  method: 'POST',
  body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
});

// PUT request
const updated = await apiCall(API_ENDPOINTS.studentDetail(id), {
  method: 'PUT',
  body: JSON.stringify({ name: 'Jane Doe' })
});

// DELETE request
await apiCall(API_ENDPOINTS.studentDetail(id), { method: 'DELETE' });
*/