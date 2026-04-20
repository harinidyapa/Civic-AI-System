import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token && req.headers) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Admin register
export const registerAdmin = async (data) => {
  return API.post("/auth/register", { ...data, role: "admin" });
};

export const verifyRegistration = async (identifier, otp) => {
  return API.post("/auth/register/verify", { identifier, otp });
};

// Admin login
export const loginAdmin = async (identifier, password) => {
  return API.post("/auth/login", { identifier, password });
};

export const requestOtp = async (identifier) => {
  return API.post("/auth/request-otp", { identifier });
};

export const verifyOtp = async (identifier, otp) => {
  return API.post("/auth/verify-otp", { identifier, otp });
};

export const requestPasswordReset = async (identifier) => {
  return API.post("/auth/forgot-password", { identifier });
};

export const verifyPasswordReset = async (identifier, otp, newPassword) => {
  return API.post("/auth/forgot-password/verify", { identifier, otp, newPassword });
};

export const getProfile = async () => API.get("/auth/me");
export const updateProfile = async (name) => API.put("/auth/profile", { name });
export const changePassword = async (currentPassword, newPassword) =>
  API.put("/auth/change-password", { currentPassword, newPassword });

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