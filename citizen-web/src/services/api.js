import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // match your backend port
});

// Login function
export const loginUser = async (email, password) => {
  return API.post("/auth/login", { email, password });
};

// Register function
export const registerUser = async (name, email, password) => {
  return API.post("/auth/register", { name, email, password });
};

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