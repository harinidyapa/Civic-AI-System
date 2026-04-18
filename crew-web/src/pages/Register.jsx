import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { registerCrew, verifyRegistration } from "../services/api";
import { HardHat, User, Mail, Lock, ArrowRight } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState("signup");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await registerCrew({ name, email, password });
      setPhase("otp");
      setMessage("OTP sent to your email. Enter it below to complete registration.");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp) {
      setError("OTP is required");
      return;
    }

    setIsLoading(true);
    try {
      await verifyRegistration(email, otp);
      alert("Registration confirmed. Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
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
          <h1 className="text-3xl font-bold text-white mb-2">Join Field Team</h1>
          <p className="text-orange-100">Become part of our service crew</p>
        </motion.div>

        {/* Register Form */}
        <motion.div
          className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
          variants={itemVariants}
        >
          <h2 className="text-2xl font-semibold text-white text-center mb-6">Create Account</h2>

          <form className="space-y-6" onSubmit={phase === "signup" ? handleSignUp : handleVerify}>
            {phase === "signup" ? (
              <>
                <motion.div
                  variants={itemVariants}
                  whileFocus={{ scale: 1.02 }}
                >
                  <div className="relative">
                    <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-300" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/20 border border-white/30 rounded-2xl text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  whileFocus={{ scale: 1.02 }}
                >
                  <div className="relative">
                    <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Crew Email"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/20 border border-white/30 rounded-2xl text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  whileFocus={{ scale: 1.02 }}
                >
                  <div className="relative">
                    <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-300" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Secure Password"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/20 border border-white/30 rounded-2xl text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  whileFocus={{ scale: 1.02 }}
                >
                  <div className="relative">
                    <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-300" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
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
                      Sending OTP...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Join Team
                      <ArrowRight size={20} className="ml-2" />
                    </div>
                  )}
                </motion.button>
              </>
            ) : (
              <>
                <motion.div
                  variants={itemVariants}
                  whileFocus={{ scale: 1.02 }}
                >
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="w-full pl-4 pr-4 py-4 bg-white/20 border border-white/30 rounded-2xl text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
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
                  {isLoading ? "Verifying OTP..." : "Verify Registration OTP"}
                </motion.button>
              </>
            )}
          </form>

          <motion.div
            className="mt-6 text-center"
            variants={itemVariants}
          >
            <p className="text-orange-200">
              Already part of the team?{" "}
              <Link
                to="/login"
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors duration-300"
              >
                Sign in here
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Safety Notice */}
        <motion.div
          className="text-center mt-6"
          variants={itemVariants}
        >
          <p className="text-orange-300 text-sm">
            ⚠️ Field work requires safety training. Contact supervisor for orientation.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}