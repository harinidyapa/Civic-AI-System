import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, User, FileText, BarChart3, Users, LogOut, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar({ setActivePage, activePage }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      navigate("/");
      setIsMenuOpen(false);
    }
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

  const navItems = [
    { id: "allissues", label: "All Issues", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "crew", label: "Crew Management", icon: Users }
  ];

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
            <div className="text-2xl font-bold text-slate-800 hover:text-indigo-600 transition-colors duration-300 flex items-center space-x-2">
              <Shield size={28} className="text-indigo-600" />
              <span>Admin Portal</span>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
                    activePage === item.id
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-700 hover:text-indigo-600 hover:bg-indigo-50"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/profile" className="flex items-center space-x-2 text-slate-700 hover:text-indigo-600 transition-colors duration-300 px-4 py-2 rounded-2xl hover:bg-indigo-50">
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
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-indigo-600" />
            </div>
            <span className="text-slate-700 font-medium">
              {localStorage.getItem("userName") || "Administrator"} - {localStorage.getItem("userRole") || "admin"}
            </span>
          </motion.div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={toggleMenu}
              className="text-slate-700 hover:text-indigo-600 transition-colors duration-300 p-2"
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
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-xl font-medium transition-all duration-300 ${
                        activePage === item.id
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "text-slate-700 hover:text-indigo-600 hover:bg-indigo-50"
                      }`}
                      variants={itemVariants}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </motion.button>
                  );
                })}

                <motion.div variants={itemVariants}>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 w-full text-left text-slate-700 hover:text-indigo-600 transition-colors duration-300 rounded-xl hover:bg-indigo-50">
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
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-indigo-600" />
                  </div>
                  <span className="text-slate-700 font-medium">
                    {localStorage.getItem("userName") || "Administrator"} - {localStorage.getItem("userRole") || "admin"}
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