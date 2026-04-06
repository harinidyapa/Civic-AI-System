import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, User, Home, FileText, LogOut, HardHat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    // clear all stored tokens and user info
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
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
            <Link to="/dashboard" className="text-2xl font-bold text-slate-800 hover:text-amber-600 transition-colors duration-300 flex items-center space-x-2">
              <HardHat size={28} className="text-amber-600" />
              <span>Crew Portal</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/dashboard" className="flex items-center space-x-2 text-slate-700 hover:text-amber-600 transition-colors duration-300">
                <Home size={18} />
                <span>Dashboard</span>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/issues" className="flex items-center space-x-2 text-slate-700 hover:text-amber-600 transition-colors duration-300">
                <FileText size={18} />
                <span>Assigned Issues</span>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/profile" className="flex items-center space-x-2 text-slate-700 hover:text-amber-600 transition-colors duration-300">
                <User size={18} />
                <span>Profile</span>
              </Link>
            </motion.div>
          </div>

          {/* Profile Section (Desktop) */}
          <motion.div
            className="hidden md:flex items-center space-x-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-amber-600" />
            </div>
            <span className="text-slate-700 font-medium">
              {localStorage.getItem("userName") || "Crew Member"} - {localStorage.getItem("userRole") || "crew"}
            </span>
          </motion.div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={toggleMenu}
              className="text-slate-700 hover:text-amber-600 transition-colors duration-300 p-2"
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
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:text-amber-600 transition-colors duration-300">
                    <Home size={18} />
                    <span>Dashboard</span>
                  </Link>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Link to="/issues" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:text-amber-600 transition-colors duration-300">
                    <FileText size={18} />
                    <span>Assigned Issues</span>
                  </Link>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 text-slate-700 hover:text-amber-600 transition-colors duration-300">
                    <User size={18} />
                    <span>Profile</span>
                  </Link>
                </motion.div>
              </div>

              {/* Profile Section (Mobile) */}
              <motion.div
                className="px-3 py-2 border-t border-slate-200"
                variants={itemVariants}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-amber-600" />
                  </div>
                  <span className="text-slate-700 font-medium">
                    {localStorage.getItem("userName") || "Crew Member"} - {localStorage.getItem("userRole") || "crew"}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

export default Navbar;