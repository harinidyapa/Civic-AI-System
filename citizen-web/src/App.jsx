import { Routes, Route } from "react-router-dom";
import { useState } from "react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ReportIssue from "./pages/ReportIssue";
import MyReports from "./pages/MyReports";
import Logs from "./pages/Logs";
import Profile from "./pages/Profile";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/report" element={<ProtectedRoute isLoggedIn={isLoggedIn}><ReportIssue /></ProtectedRoute>} />
          <Route path="/my-reports" element={<ProtectedRoute isLoggedIn={isLoggedIn}><MyReports /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Logs /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Profile setIsLoggedIn={setIsLoggedIn} /></ProtectedRoute>} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;