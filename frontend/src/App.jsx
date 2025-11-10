import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import PublicProfile from "./components/PublicProfile";
import StudentReportsPage from './components/student/StudentReportsPage';

function App() {
  const user = { name: "John Doe", role: "admin" }; // Example user, replace with actual user from your auth systemlecturer
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student/reports" element={<StudentReportsPage />} />
        <Route path="/profile/:username" element={<PublicProfile />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} /> {/* Ensure user is passed as a prop */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
