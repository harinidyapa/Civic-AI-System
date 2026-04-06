import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // match your backend port
});

// Login function (password flow)
export const loginUser = async (identifier, password) => {
  return API.post("/auth/login", { identifier, password });
};

// OTP functions (login)
export const requestOtp = async (identifier) => {
  return API.post("/auth/request-otp", { identifier });
};

export const verifyOtp = async (identifier, otp) => {
  return API.post("/auth/verify-otp", { identifier, otp });
};

// Register function (send OTP)
export const registerUser = async (name, email, password) => {
  return API.post("/auth/register", { name, email, password, role: "citizen" });
};

// Verify registration OTP
export const verifyRegistration = async (identifier, otp) => {
  return API.post("/auth/register/verify", { identifier, otp });
};

// Forgot password flows
export const requestPasswordReset = async (identifier) => {
  return API.post("/auth/forgot-password", { identifier });
};

export const verifyPasswordReset = async (identifier, otp, newPassword) => {
  return API.post("/auth/forgot-password/verify", { identifier, otp, newPassword });
};

// Profile API functions
export const getProfile = () => API.get("/auth/me");
export const updateProfile = (name) => API.put("/auth/profile", { name });
export const changePassword = (currentPassword, newPassword) =>
  API.put("/auth/change-password", { currentPassword, newPassword });

// Submit Issue function
export const submitIssue = async (issueData, token) => {
  return API.post("/issues", issueData, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
  });
};

export const getMyReports = () => {
  const token = localStorage.getItem("token");

  return axios.get("http://localhost:5000/api/issues/my", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getIssueDetail = (issueId) => {
  const token = localStorage.getItem("token");

  return axios.get(`http://localhost:5000/api/issues/${issueId}/detail`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const markLogsAsViewed = (issueId) => {
  const token = localStorage.getItem("token");

  return axios.put(
    `http://localhost:5000/api/issues/${issueId}/logs/viewed`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};