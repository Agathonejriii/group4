// src/api/config.js - COMPLETE UPDATED VERSION
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.101.230.98:8000/api';

// Enhanced fetch with timeout and debugging
const debugFetch = async (url, options = {}) => {
  console.log('🔍 FETCH DEBUG:');
  console.log('URL:', url);
  console.log('Method:', options.method || 'GET');
  console.log('Headers:', options.headers);
  
  try {
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response OK:', response.ok);
    
    return response;
  } catch (error) {
    console.log('❌ Fetch Error:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server not responding. Check if Django is running.');
    } else if (error.message.includes('Network request failed')) {
      throw new Error('Cannot connect to server. Check: 1) Django is running, 2) Correct IP address, 3) Same WiFi network');
    } else {
      throw new Error(`Network error: ${error.message}`);
    }
  }
};

// Test backend connection first
export const testBackendConnection = async () => {
  try {
    console.log('🧪 Testing backend connection...');
    const response = await debugFetch(`${API_URL}/accounts/login/`, {
      method: 'OPTIONS', // Use OPTIONS to test CORS without sending data
    });
    
    console.log('Connection test response:', response.status);
    return response.ok;
  } catch (error) {
    console.log('Backend connection test failed:', error.message);
    return false;
  }
};

// Token management
export const storeToken = async (accessToken, refreshToken) => {
  try {
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem('refreshToken');
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

// User data storage
export const storeUser = async (user) => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user:', error);
  }
};

export const getUser = async () => {
  try {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Enhanced Login function
export const loginUser = async (username, password) => {
  try {
    console.log('🚀 Attempting login...');
    
    // First test connection
    const isConnected = await testBackendConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to server. Please check your connection and try again.');
    }

    const response = await debugFetch(`${API_URL}/accounts/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log('Login response status:', response.status);

    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
        console.log('Login error details:', errorData);
      } catch (parseError) {
        const errorText = await response.text();
        console.log('Login error response text:', errorText);
        errorMessage = `Server error: ${response.status} - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Login successful! User:', data.username || data.user?.username);
    
    // Store tokens
    if (data.access && data.refresh) {
      await storeToken(data.access, data.refresh);
      console.log('✅ Tokens stored');
    }
    
    // Store user data - handle both response formats
    const userData = {
      username: data.username || data.user?.username,
      email: data.email || data.user?.email,
      role: data.role || data.user?.role || 'student',
      ...data.user, // Include any additional user fields
    };
    
    await storeUser(userData);
    console.log('✅ User data stored');
    
    // Return data in consistent format
    return {
      ...data,
      user: userData,
    };
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
};

// Enhanced Register function with detailed error handling
export const registerUser = async (userData) => {
  try {
    console.log('🚀 Attempting registration with data:', {
      username: userData.username,
      email: userData.email,
      role: userData.role,
      // Don't log password
    });
    
    // First test connection
    const isConnected = await testBackendConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to server. Please check your connection and try again.');
    }

    // Ensure all required fields are present
    const registrationData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'student',
    };

    console.log('📤 Sending registration data:', {
      username: registrationData.username,
      email: registrationData.email,
      role: registrationData.role,
      // Don't log password
    });

    const response = await debugFetch(`${API_URL}/accounts/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    });

    console.log('Register response status:', response.status);

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.log('Registration error details:', errorData);
        
        // Handle specific field errors
        if (errorData.username) {
          throw new Error(`Username: ${Array.isArray(errorData.username) ? errorData.username[0] : errorData.username}`);
        }
        if (errorData.email) {
          throw new Error(`Email: ${Array.isArray(errorData.email) ? errorData.email[0] : errorData.email}`);
        }
        if (errorData.password) {
          throw new Error(`Password: ${Array.isArray(errorData.password) ? errorData.password[0] : errorData.password}`);
        }
        if (errorData.role) {
          throw new Error(`Role: ${Array.isArray(errorData.role) ? errorData.role[0] : errorData.role}`);
        }
        if (errorData.detail) {
          throw new Error(errorData.detail);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        
        // Generic error message
        throw new Error('Registration failed. Please check your information and try again.');
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes(':')) {
          // Re-throw our custom error messages
          throw parseError;
        }
        const errorText = await response.text();
        console.log('Registration error response text:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    }

    const data = await response.json();
    console.log('✅ Registration successful!');
    return data;
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    throw error;
  }
};

// Refresh token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = await getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await debugFetch(`${API_URL}/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    await AsyncStorage.setItem('accessToken', data.access);
    return data.access;
  } catch (error) {
    await clearTokens();
    throw error;
  }
};

// Fetch with authentication
export const fetchWithAuth = async (endpoint, options = {}) => {
  let token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token');
  }

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  let response = await debugFetch(`${API_URL}${endpoint}`, config);
  
  // If token expired, try to refresh
  if (response.status === 401) {
    try {
      token = await refreshAccessToken();
      config.headers['Authorization'] = `Bearer ${token}`;
      response = await debugFetch(`${API_URL}${endpoint}`, config);
    } catch (error) {
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.message || 'Request failed');
  }

  return await response.json();
};

// Logout
export const logoutUser = async () => {
  try {
    console.log('👋 Logging out...');
    await clearTokens();
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Export API_URL for use in other files if needed
export { API_URL };
