import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auth
export const registerCrew = (data) =>
  API.post("/auth/register", { ...data, role: "crew" });

export const verifyRegistration = (identifier, otp) =>
  API.post("/auth/register/verify", { identifier, otp });

export const loginCrew = (identifier, password) =>
  API.post("/auth/login", { identifier, password });

export const requestOtp = (identifier) =>
  API.post("/auth/request-otp", { identifier });

export const verifyOtp = (identifier, otp) =>
  API.post("/auth/verify-otp", { identifier, otp });

export const requestPasswordReset = (identifier) =>
  API.post("/auth/forgot-password", { identifier });

export const verifyPasswordReset = (identifier, otp, newPassword) =>
  API.post("/auth/forgot-password/verify", { identifier, otp, newPassword });

// Profile
export const getProfile = () => API.get("/auth/me");
export const updateProfile = (name) => API.put("/auth/profile", { name });
export const changePassword = (currentPassword, newPassword) =>
  API.put("/auth/change-password", { currentPassword, newPassword });

// Issues
export const getAssignedIssues = () =>
  API.get("/issues/assigned");

// ── RAG: Get AI resolution suggestion for an issue ──
export const getRAGSuggestion = (issueId) =>
  API.get(`/issues/${issueId}/rag-suggest`);

export const updateIssueStatus = (
  id, status,
  { comment = null, evidenceFiles = [], rejectionReason = null, crewNote = null, relatedIssue = null } = {}
) => {
  if (evidenceFiles.length > 0 || rejectionReason || crewNote || relatedIssue) {
    const form = new FormData();
    form.append("status", status);
    if (comment) form.append("comment", comment);
    if (rejectionReason) form.append("rejectionReason", rejectionReason);
    if (crewNote) form.append("crewNote", crewNote);
    if (relatedIssue) form.append("relatedIssue", relatedIssue);
    evidenceFiles.forEach((file) => form.append("evidence", file));
    return API.put(`/issues/${id}/status`, form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  }
  return API.put(`/issues/${id}/status`, { status, comment: comment || undefined });
};