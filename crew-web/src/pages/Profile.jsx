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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getProfile();
        setName(res.data.user.name || "");
        setEmail(res.data.user.email || "");
        setRole(res.data.user.role || "");
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load profile");
      }
    };
    loadProfile();
  }, []);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be blank");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await updateProfile(name.trim());
      setMessage(res.data.message || "Profile updated");
      localStorage.setItem("userName", res.data.user.name);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError("Both current and new passwords are required");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await changePassword(currentPassword, newPassword);
      setMessage(res.data.message || "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-amber-50 p-4 flex justify-center">
      <div className="w-full max-w-2xl bg-white border border-amber-200 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-amber-900">Profile</h1>
        <p className="text-sm text-amber-700 mb-5">Edit username, change password, and sign out from here</p>

        {message && <div className="mb-4 p-3 bg-emerald-100 text-emerald-800 rounded">{message}</div>}
        {error && <div className="mb-4 p-3 bg-rose-100 text-rose-800 rounded">{error}</div>}

        <div className="mb-4">
          <p className="text-sm text-amber-700">Email</p>
          <p className="font-medium text-amber-900">{email}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-amber-700">Role</p>
          <p className="font-medium text-amber-900">{role}</p>
        </div>

        <form onSubmit={handleUpdateName} className="space-y-3 mb-6">
          <label className="block">
            <span className="text-sm font-medium text-amber-700">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-amber-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </label>

          <button disabled={isLoading} type="submit" className="bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800">
            {isLoading ? "Updating..." : "Update Name"}
          </button>
        </form>

        <form onSubmit={handleChangePassword} className="space-y-3 mb-6">
          <label className="block">
            <span className="text-sm font-medium text-amber-700">Current Password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full border border-amber-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-amber-700">New Password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full border border-amber-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </label>

          <button disabled={isLoading} type="submit" className="bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800">
            {isLoading ? "Updating..." : "Change Password"}
          </button>
        </form>

        <button onClick={handleLogout} className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Logout
        </button>
      </div>
    </div>
  );
}
