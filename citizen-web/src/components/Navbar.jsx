import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Menu, X, User, Home, FileText, LogIn, UserPlus, History, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyReports, getProfile } from "../services/api";

function Navbar({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [profile, setProfile] = useState({
    name: localStorage.getItem("userName") || "Citizen",
    email: localStorage.getItem("userEmail") || "",
    role: localStorage.getItem("userRole") || "citizen",
  });
  const profileRef = useRef(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUnviewedCount();
      fetchProfile();
      const interval = setInterval(fetchUnviewedCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  const fetchUnviewedCount = async () => {
    try {
      const { data } = await getMyReports();
      let count = 0;
      data.forEach((issue) => {
        if (issue.activityLog) {
          count += issue.activityLog.filter((log) => !log.isViewed).length;
        }
      });
      setUnviewedCount(count);
    } catch (error) {
      console.error("Error fetching unviewed logs:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await getProfile();
      const user = data.user || {};
      const nextProfile = {
        name: user.name || localStorage.getItem("userName") || "Citizen",
        email: user.email || localStorage.getItem("userEmail") || "",
        role: user.role || localStorage.getItem("userRole") || "citizen",
      };
      setProfile(nextProfile);
      localStorage.setItem("userName", nextProfile.name);
      localStorage.setItem("userRole", nextProfile.role);
      if (nextProfile.email) {
        localStorage.setItem("userEmail", nextProfile.email);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    navigate("/login");
  };

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const toggleProfile = () => {
    setIsProfileOpen((prev) => {
      const next = !prev;
      if (next) fetchProfile();
      return next;
    });
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
    open: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    closed: {
      x: -20,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
    open: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/30 border-b border-white/20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div className="flex-shrink-0" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/" className="text-2xl font-bold text-slate-800 hover:text-emerald-600 transition-colors duration-300">
              Civic AI
            </Link>
          </motion.div>

          <div className="hidden md:flex items-center space-x-8">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/" className="flex items-center space-x-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300">
                <Home size={18} />
                <span>Home</span>
              </Link>
            </motion.div>
            {!isLoggedIn && (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/login" className="flex items-center space-x-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300">
                    <LogIn size={18} />
                    <span>Login</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/register" className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-2xl hover:bg-emerald-700 transition-colors duration-300">
                    <UserPlus size={18} />
                    <span>Register</span>
                  </Link>
                </motion.div>
              </>
            )}
            {isLoggedIn && (
              <>
                <motion.button
                  onClick={() => window.dispatchEvent(new Event("app-refresh"))}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300"
                >
                  <RefreshCw size={18} />
                  <span>Refresh</span>
                </motion.button>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/report" className="flex items-center space-x-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300">
                    <FileText size={18} />
                    <span>Report Issue</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/my-reports" className="flex items-center space-x-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300">
                    <FileText size={18} />
                    <span>My Reports</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
                  <Link to="/logs" className="flex items-center space-x-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300">
                    <History size={18} />
                    <span>Logs</span>
                    {unviewedCount > 0 && (
                      <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unviewedCount > 99 ? "99+" : unviewedCount}
                      </span>
                    )}
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {isLoggedIn && (
            <div ref={profileRef} className="hidden md:flex items-center relative">
              <motion.div
                onClick={toggleProfile}
                className="flex items-center space-x-3 cursor-pointer rounded-2xl border border-transparent px-4 py-2 hover:border-emerald-200 hover:bg-emerald-50 transition-colors duration-200"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-slate-700 font-medium">{profile.name}</p>
                  <p className="text-xs text-slate-500">{profile.role}</p>
                </div>
              </motion.div>
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User size={24} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">{profile.role}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-700">
                      <div>
                        <span className="font-medium text-slate-900">Email:</span>
                        <div className="mt-1 text-slate-600 break-all">{profile.email || "Not available"}</div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:border-slate-300 transition-colors duration-200"
                    >
                      Manage Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="md:hidden">
            <motion.button
              onClick={toggleMenu}
              className="text-slate-700 hover:text-emerald-600 transition-colors duration-300 p-2"
              whileTap={{ scale: 0.95 }}
              animate={{ rotate: isMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden bg-white/90 backdrop-blur-md rounded-2xl mt-2 shadow-xl border border-white/20"
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuVariants}
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                <motion.div variants={itemVariants}>
                  <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300">
                    <Home size={18} />
                    <span>Home</span>
                  </Link>
                </motion.div>
                {!isLoggedIn && (
                  <>
                    <motion.div variants={itemVariants}>
                      <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300">
                        <LogIn size={18} />
                        <span>Login</span>
                      </Link>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Link to="/register" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors duration-300">
                        <UserPlus size={18} />
                        <span>Register</span>
                      </Link>
                    </motion.div>
                  </>
                )}
                {isLoggedIn && (
                  <>
                    <motion.div variants={itemVariants}>
                      <button
                        onClick={() => {
                          window.dispatchEvent(new Event("app-refresh"));
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300 w-full text-left rounded-xl hover:bg-emerald-50"
                      >
                        <RefreshCw size={18} />
                        <span>Refresh</span>
                      </button>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Link to="/report" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300">
                        <FileText size={18} />
                        <span>Report Issue</span>
                      </Link>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Link to="/my-reports" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300">
                        <FileText size={18} />
                        <span>My Reports</span>
                      </Link>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Link to="/logs" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300">
                        <History size={18} />
                        <span>Logs</span>
                        {unviewedCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {unviewedCount > 99 ? "99+" : unviewedCount}
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>
              {isLoggedIn && (
                <div className="border-t border-slate-200 px-3 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">{profile.role}</p>
                    </div>
                  </div>
                  <div className="mb-3 text-sm text-slate-600 break-all">{profile.email || "Email not available"}</div>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setIsMenuOpen(false);
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 transition-colors duration-200"
                  >
                    Manage Profile
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full mt-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

export default Navbar;
