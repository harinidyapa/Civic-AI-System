import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auth
export const registerCrew = (data) =>
  API.post("/auth/register", { ...data, role: "crew" });

export const loginCrew = (data) =>
  API.post("/auth/login", data);

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