const API_URL = "http://127.0.0.1:8000/accounts"; // Django backend

// Save token to localStorage
export const setToken = (token) => localStorage.setItem("jwtToken", token);

// Get token from localStorage
export const getToken = () => localStorage.getItem("jwtToken");

// Login
export const loginUser = async (username, password) => {
  const res = await fetch(`${API_URL}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json(); // returns {access, refresh}
};

// Refresh token
export const refreshToken = async () => {
  const token = getToken();
  const res = await fetch(`${API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: token }),
  });
  return res.json();
};

// Fetch current user
export const fetchCurrentUser = async () => {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json(); // {id, username, email, first_name, last_name, is_staff}
};

// Fetch all users (admin)
export const fetchUsers = async () => {
  const token = getToken();
  const res = await fetch(`${API_URL}/users/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

