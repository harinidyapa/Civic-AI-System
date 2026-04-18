import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile, changePassword } from "../services/api";

export default function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getProfile();
        setName(res.data.user.name || localStorage.getItem("userName") || "");
        setEmail(res.data.user.email || localStorage.getItem("userEmail") || "");
        setRole(res.data.user.role || localStorage.getItem("userRole") || "");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
        setName(localStorage.getItem("userName") || "");
        setEmail(localStorage.getItem("userEmail") || "");
        setRole(localStorage.getItem("userRole") || "");
      }
    };
    loadProfile();
  }, []);

  const onUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await updateProfile(name.trim());
      setMessage(res.data.message || "Name updated");
      localStorage.setItem("userName", res.data.user.name);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError("Current and new passwords are required");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await changePassword(currentPassword, newPassword);
      setMessage(res.data.message || "Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Profile</h1>
        <p className="text-sm text-slate-600 mb-5">Edit your username and password from here.</p>

        {message && <div className="mb-3 p-3 bg-emerald-100 text-emerald-800 rounded">{message}</div>}
        {error && <div className="mb-3 p-3 bg-rose-100 text-rose-800 rounded">{error}</div>}

        <div className="mb-4 text-sm">
          <div>Email: <span className="font-medium text-slate-900">{email}</span></div>
          <div>Role: <span className="font-medium text-slate-900">{role}</span></div>
        </div>

        <form onSubmit={onUpdateName} className="space-y-3 mb-6">
          <label className="block">
            <span className="text-sm text-slate-700">Name</span>
            <input className="w-full mt-1 border border-slate-300 rounded-lg p-2" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            {loading ? "Saving..." : "Update Name"}
          </button>
        </form>

        <form onSubmit={onChangePassword} className="space-y-3 mb-6">
          <label className="block">
            <span className="text-sm text-slate-700">Current Password</span>
            <input type="password" className="w-full mt-1 border border-slate-300 rounded-lg p-2" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm text-slate-700">New Password</span>
            <input type="password" className="w-full mt-1 border border-slate-300 rounded-lg p-2" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </label>
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>

        <button onClick={handleLogout} className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Logout
        </button>
      </div>
    </div>
  );
}
