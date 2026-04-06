import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../services/api";

const Profile = ({ setIsLoggedIn }) => {
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
    const fetchProfile = async () => {
      try {
        const { data } = await getProfile();
        setName(data.user.name || "");
        setEmail(data.user.email || "");
        setRole(data.user.role || "");
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!name) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { data } = await updateProfile(name);
      setName(data.user.name);
      setMessage(data.message || "Profile updated successfully");
      localStorage.setItem("userName", data.user.name);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError("Current and new password are required");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { data } = await changePassword(currentPassword, newPassword);
      setMessage(data.message || "Password changed successfully");
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
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Profile</h2>
        <p className="text-sm text-slate-500 mb-4">Manage your account name and password.</p>

        {message && <div className="mb-3 p-3 rounded-md bg-emerald-100 text-emerald-800">{message}</div>}
        {error && <div className="mb-3 p-3 rounded-md bg-rose-100 text-rose-800">{error}</div>}

        <div className="mb-4">
          <div className="text-sm text-slate-500">Email (readonly)</div>
          <div className="text-slate-800 font-medium">{email}</div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-slate-500">Role</div>
          <div className="text-slate-800 font-medium">{role}</div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4 mb-6">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </label>

          <button disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            {loading ? "Saving..." : "Update Name"}
          </button>
        </form>

        <form onSubmit={handleChangePassword} className="space-y-4 mb-6">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Current Password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">New Password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </label>

          <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>

        <div className="border-t border-slate-200 pt-4">
          <button onClick={handleLogout} className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
