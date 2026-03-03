import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // backend URL
});

// Admin register
export const registerAdmin = async (data) => {
  return API.post("/auth/register", { ...data, role: "admin" });
};

// Admin login
export const loginAdmin = async (email, password) => {
  return API.post("/auth/login", { email, password });
};

// Get all issues (admin only)
export const getAllIssues = async (token, excludeResolved = false) => {
  const params = excludeResolved ? "?excludeResolved=true" : "";
  return API.get(`/issues${params}`, { headers: { Authorization: `Bearer ${token}` } });
};

// Get all crew members
export const getCrews = async (token) => {
  return API.get("/admin/crews", { headers: { Authorization: `Bearer ${token}` } });
};

// Get resolved/archived issues
export const getResolvedIssues = async (token) => {
  return API.get("/issues", { headers: { Authorization: `Bearer ${token}` } });
};

// Assign issue to crew
export const assignIssue = async (id, crewId, token) => {
  return API.put(`/issues/${id}/assign`, { crewId }, { headers: { Authorization: `Bearer ${token}` } });
};