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
      setMessage("OTP sent to email. Use it to reset your password.");
      setPhase("verify");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset OTP");
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
      alert("Password changed successfully. Please login with new credentials.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-orange-900 to-amber-800 p-4">
      <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
        <h2 className="text-2xl font-semibold text-white mb-4">Forgot Password</h2>
        <p className="text-orange-200 mb-4">Use your email or username to reset your password via OTP.</p>

        {message && <div className="mb-3 text-sm text-emerald-100">{message}</div>}
        {error && <div className="mb-3 text-sm text-red-200">{error}</div>}

        {phase === "request" ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or Username"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white"
            />
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-amber-600 rounded-xl text-white">
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or Username"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white"
            />
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="OTP Code"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white"
            />
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="New Password"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white"
            />
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-amber-600 rounded-xl text-white">
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-4 text-white text-sm">
          <Link to="/login" className="underline hover:text-amber-200">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
