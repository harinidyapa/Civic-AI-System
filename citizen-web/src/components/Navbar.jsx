import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, User, Home, FileText, LogOut, LogIn, UserPlus, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyReports } from "../services/api";

function Navbar({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);

  // Fetch unviewed logs count
  useEffect(() => {
    if (isLoggedIn) {
      fetchUnviewedCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchUnviewedCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchUnviewedCount = async () => {
    try {
      const { data } = await getMyReports();
      let count = 0;
      data.forEach(issue => {
        if (issue.activityLog) {
          count += issue.activityLog.filter(log => !log.isViewed).length;
        }
      });
      setUnviewedCount(count);
    } catch (error) {
      console.error("Error fetching unviewed logs:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    navigate("/login");
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Animation variants
  const menuVariants = {
    closed: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    },
    open: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    closed: {
      x: -20,
      opacity: 0,
      transition: {
        duration: 0.2
      }
    },
    open: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/30 border-b border-white/20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            className="flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="text-2xl font-bold text-slate-800 hover:text-emerald-600 transition-colors duration-300">
              Civic AI
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
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
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/profile" className="flex items-center space-x-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300">
                    <User size={18} />
                    <span>Profile</span>
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

          {/* Profile Section (Desktop) */}
          {isLoggedIn && (
            <motion.div
              className="hidden md:flex items-center space-x-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-emerald-600" />
              </div>
              <span className="text-slate-700 font-medium">
                {localStorage.getItem("userName") || "Citizen"} - {localStorage.getItem("userRole") || "citizen"}
              </span>
            </motion.div>
          )}

          {/* Mobile menu button */}
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

        {/* Mobile Navigation */}
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
                      <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:text-emerald-600 transition-colors duration-300">
                        <User size={18} />
                        <span>Profile</span>
                      </Link>
                    </motion.div>
                    <motion.div variants={itemVariants} className="relative">
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

              {/* Profile Section (Mobile) */}
              {isLoggedIn && (
                <motion.div
                  className="px-3 py-2 border-t border-slate-200"
                  variants={itemVariants}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User size={16} className="text-emerald-600" />
                    </div>
                    <span className="text-slate-700 font-medium">
                      {localStorage.getItem("userName") || "Citizen"} - {localStorage.getItem("userRole") || "citizen"}
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

export default Navbar;