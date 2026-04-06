import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";
import { LogIn } from "lucide-react";

function Login({ setIsLoggedIn }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      setError("Email/username and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await loginUser(identifier, password);
      localStorage.setItem("token", res.data.token);
      if (res.data.name) localStorage.setItem("userName", res.data.name);
      if (res.data.role) localStorage.setItem("userRole", res.data.role);
      setIsLoggedIn(true);
      navigate("/report");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };


  const handleContinue = async (e) => {
    e.preventDefault();
    if (!identifier) {
      alert("Email or username is required");
      return;
    }
    setLoading(true);
    try {
      await requestOtp(identifier);
      setPhase("otp");
      setMessage("OTP sent to your email (check spam). Enter code to complete login.");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "OTP request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!identifier || !otp) {
      alert("Email/username and OTP are required");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(identifier, otp);
      localStorage.setItem("token", res.data.token);
      if (res.data.name) localStorage.setItem("userName", res.data.name);
      if (res.data.role) localStorage.setItem("userRole", res.data.role);
      setIsLoggedIn(true);
      alert("Login successful via OTP!");
      navigate("/report");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      alert("Email/username and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser(identifier, password);
      localStorage.setItem("token", res.data.token);
      if (res.data.name) localStorage.setItem("userName", res.data.name);
      if (res.data.role) localStorage.setItem("userRole", res.data.role);
      setIsLoggedIn(true);
      alert("Login successful!");
      navigate("/report");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-emerald-600 rounded-full p-3">
              <LogIn size={28} className="text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Welcome Back</h2>
          <p className="text-center text-slate-600 mb-8">Sign in to your citizen account</p>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email or Username</label>
              <input
                type="text"
                placeholder="you@example.com or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="text-right mt-2">
            <Link to="/forgot-password" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              Forgot password?
            </Link>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-600">New to Civic AI?</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-700">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
                Register here
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-sm mt-6">By logging in, you agree to our Terms & Conditions</p>
      </div>
    </div>
  );
}

export default Login;