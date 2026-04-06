import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestPasswordReset, verifyPasswordReset } from "../services/api";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [phase, setPhase] = useState("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!identifier) {
      alert("Email or username is required");
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(identifier);
      setPhase("verify");
      setMessage("A reset OTP has been sent to your email. Enter it below along with new password.");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!identifier || !otp || !newPassword) {
      alert("All fields are required");
      return;
    }
    setLoading(true);
    try {
      await verifyPasswordReset(identifier, otp, newPassword);
      alert("Password reset successful. Please login with your new password.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-slate-200 shadow-lg">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Forgot Password</h2>
        <p className="text-sm text-slate-600 mb-6">Enter your email or username to receive a password reset OTP.</p>

        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded">
            {message}
          </div>
        )}

        <form onSubmit={phase === "request" ? handleRequest : handleVerify} className="space-y-4">
          <input
            type="text"
            placeholder="Email or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          {phase === "verify" && (
            <>
              <input
                type="text"
                placeholder="OTP code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Please wait..." : phase === "request" ? "Send OTP" : "Reset Password"}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-600">
          Remembered password? <Link to="/login" className="text-emerald-600 hover:text-emerald-700">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
