import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginCrew } from "../services/api";
import { motion } from "framer-motion";
import { HardHat, Mail, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Email/username and password are required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data } = await loginCrew(identifier, password);
      if (data.role !== "crew") {
        setError("Role mismatch: crew access only.");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      if (data.name) localStorage.setItem("userName", data.name);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };


  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900 via-orange-900 to-amber-800 p-4">
      <motion.div
        className="w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Logo and Title */}
        <motion.div
          className="text-center mb-8"
          variants={itemVariants}
        >
          <motion.div
            className="flex justify-center mb-4"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <HardHat size={60} className="text-amber-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Crew Portal</h1>
          <p className="text-orange-100">Field operations access point</p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
          variants={itemVariants}
        >
          <h2 className="text-2xl font-semibold text-white text-center mb-6">Field Login</h2>

          {error && (
            <div className="mb-4 text-sm rounded-md bg-rose-100 border border-rose-200 text-rose-800 p-3">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <motion.div variants={itemVariants} whileFocus={{ scale: 1.02 }}>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-300" />
                <input
                  type="text"
                  placeholder="Email or Username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/20 border border-white/30 rounded-2xl text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} whileFocus={{ scale: 1.02 }}>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-300" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/20 border border-white/30 rounded-2xl text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
                />
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-600 text-white py-4 rounded-2xl font-semibold hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-amber-800 transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Logging in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Login
                  <ArrowRight size={20} className="ml-2" />
                </div>
              )}
            </motion.button>

            <div className="text-right text-sm text-orange-200">
              <Link to="/forgot-password" className="underline hover:text-white">
                Forgot password?
              </Link>
            </div>
          </form>

          <motion.div
            className="mt-6 text-center"
            variants={itemVariants}
          >
            <p className="text-orange-200">
              New to the team?{" "}
              <Link
                to="/register"
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors duration-300"
              >
                Join here
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Emergency Contact */}
        <motion.div
          className="text-center mt-6"
          variants={itemVariants}
        >
          <p className="text-orange-300 text-sm">
            Emergency? Call dispatch: <span className="font-semibold text-amber-400">(555) 911-DISPATCH</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}