import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestPasswordReset, verifyPasswordReset } from "../services/api";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [phase, setPhase] = useState("request");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!identifier) {
      setError("Email or username is required");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await requestPasswordReset(identifier);
      setMessage("Password reset OTP sent to your email.");
      setPhase("verify");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send password reset OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!identifier || !otp || !newPassword) {
      setError("All fields are required");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await verifyPasswordReset(identifier, otp, newPassword);
      alert("Password updated. Please login with your new password.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 p-4">
      <div className="w-full max-w-md bg-white/10 border-white/20 border rounded-3xl p-8 backdrop-blur-md shadow-2xl">
        <h2 className="text-2xl text-white font-semibold mb-4">Forgot Password</h2>
        <p className="text-indigo-200 mb-4">Enter your email or username to reset your password via email OTP.</p>

        {message && <div className="mb-2 text-sm text-emerald-200">{message}</div>}
        {error && <div className="mb-2 text-sm text-red-200">{error}</div>}

        {phase === "request" ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or username"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white"
            />
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-indigo-600 rounded-xl text-white">
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or username"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white"
            />
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="OTP code"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white"
            />
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-indigo-600 rounded-xl text-white">
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="text-sm text-indigo-200 mt-3">Remembered? <Link to="/login" className="underline hover:text-white">Login</Link></p>
      </div>
    </div>
  );
}
