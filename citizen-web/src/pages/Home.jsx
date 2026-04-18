import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FileText, AlertTriangle, CheckCircle, Clock, MapPin, Plus, Brain, Zap, Users } from "lucide-react";
import { motion } from "framer-motion";
import { getMyReports } from "../services/api";

function Home() {
  const [recentReports, setRecentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoadingReports(false);
        return;
      }

      try {
        setLoadingReports(true);
        const { data } = await getMyReports();
        setRecentReports(Array.isArray(data) ? data.slice(0, 6) : []);
        setReportError(null);
      } catch (error) {
        console.error("Failed to load report status:", error);
        setReportError("Unable to load your reports right now.");
        setRecentReports([]);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, []);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return <CheckCircle className="text-green-500" size={20} />;
      case "in_progress":
      case "in progress":
        return <Clock className="text-blue-500" size={20} />;
      case "pending":
        return <AlertTriangle className="text-orange-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getUrgencyColor = (urgency) => {
    const label = (urgency || "").toLowerCase();
    switch (label) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 0.1
      }
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* Hero Section */}
      <motion.div
        className="relative overflow-hidden"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            className="text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="flex items-center justify-center gap-4 mb-6"
              variants={itemVariants}
            >
              <Brain className="text-purple-600" size={40} />
              <Zap className="text-blue-600" size={36} />
              <Users className="text-emerald-600" size={38} />
            </motion.div>
            <motion.h1
              className="text-5xl md:text-6xl font-bold text-slate-800 mb-6"
              variants={itemVariants}
            >
              Welcome to <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">Civic AI</span>
            </motion.h1>
            <motion.p
              className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Join our AI-powered community to report public issues and track their resolution in real time. Together, we make our city better.
            </motion.p>

            {/* CTA Button */}
            <motion.div variants={itemVariants}>
              <Link
                to="/report"
                className="inline-flex items-center space-x-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-300 shadow-xl"
              >
                <Plus size={24} />
                <span>Report an Issue</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-100/20 to-teal-100/20 -z-10"></div>
      </motion.div>

      {/* My Reports Dashboard */}
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-slate-800 mb-4">My Reports Status</h2>
          <p className="text-slate-600">Track the progress of issues you've reported</p>
        </motion.div>

        {loadingReports ? (
          <div className="grid place-items-center py-16">
            <div className="text-center text-slate-600">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading your report status...</p>
            </div>
          </div>
        ) : reportError ? (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
            <p className="text-red-700 text-lg font-semibold mb-2">{reportError}</p>
            <p className="text-slate-600">Please refresh the page or try again later.</p>
          </div>
        ) : recentReports.length === 0 ? (
          <div className="bg-white/60 border border-slate-200 rounded-3xl p-10 text-center">
            <p className="text-slate-700 text-xl font-semibold mb-2">No reports found</p>
            <p className="text-slate-500">Submit an issue to see it here.</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {recentReports.map((report) => (
              <motion.div
                key={report._id}
                variants={cardVariants}
                whileHover="hover"
                className="backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(report.status)}
                    <span className="font-semibold text-slate-800">
                      {report.status?.replace(/_/g, " ") || "Pending"}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(report.urgencyLabel || report.urgency)}`}>
                    {report.urgencyLabel || report.urgency || "Unknown"}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-800 mb-2">{report.title}</h3>

                <div className="flex items-center space-x-2 text-slate-600 mb-2">
                  <MapPin size={16} />
                  <span className="text-sm">{report.location?.address || "Location not available"}</span>
                </div>

                <div className="flex items-center space-x-2 text-slate-500">
                  <FileText size={16} />
                  <span className="text-sm">Reported on {new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View All Reports Button */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link
            to="/my-reports"
            className="inline-flex items-center space-x-2 bg-slate-600 text-white px-6 py-3 rounded-2xl font-medium hover:bg-slate-700 transition-colors duration-300"
          >
            <FileText size={18} />
            <span>View All Reports</span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        className="bg-white/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-4">AI-Powered Civic Engagement</h2>
            <p className="text-slate-600">Experience the future of community-driven issue resolution</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-6 text-center shadow-xl"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FileText className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Smart Reporting</h3>
              <p className="text-slate-600">AI-enhanced issue categorization and automatic severity assessment for faster response.</p>
            </motion.div>

            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-6 text-center shadow-xl"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Brain className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">AI Analysis</h3>
              <p className="text-slate-600">Machine learning algorithms analyze images and text to prioritize and route issues efficiently.</p>
            </motion.div>

            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-6 text-center shadow-xl"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Real-Time Tracking</h3>
              <p className="text-slate-600">Live updates on issue status with predictive resolution timelines powered by AI insights.</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default Home;