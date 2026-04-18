import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, BarChart3, FileText, ArrowRight, CheckCircle, Brain, Zap, Target } from "lucide-react";
import { getAllIssues, getCrews } from "../services/api";

export default function Home() {
  const [stats, setStats] = useState([
    { number: "247", label: "Total Issues", icon: FileText },
    { number: "89", label: "Active Issues", icon: CheckCircle },
    { number: "23", label: "Field Teams", icon: Users },
    { number: "98%", label: "Resolution Rate", icon: BarChart3 }
  ]);

  useEffect(() => {
    const loadStats = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const [issuesRes, crewsRes] = await Promise.all([
          getAllIssues(token, false),
          getCrews(token)
        ]);
        const issues = issuesRes.data || [];
        const crews = crewsRes.data || [];
        const activeCount = issues.filter((issue) => issue.status !== "resolved" && issue.status !== "rejected").length;
        const resolvedCount = issues.filter((issue) => issue.status === "resolved").length;
        const totalCount = issues.length;
        const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

        setStats([
          { number: String(totalCount), label: "Total Issues", icon: FileText },
          { number: String(activeCount), label: "Active Issues", icon: CheckCircle },
          { number: String(crews.length), label: "Field Teams", icon: Users },
          { number: `${resolutionRate}%`, label: "Resolution Rate", icon: BarChart3 }
        ]);
      } catch (error) {
        console.error("Unable to fetch admin summary stats:", error);
      }
    };

    loadStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
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
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const features = [
    {
      icon: Brain,
      title: "AI Issue Analysis",
      description: "Machine learning-powered categorization and priority assessment of civic reports"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Real-time insights and predictive analytics for efficient resource allocation"
    },
    {
      icon: Target,
      title: "Crew Optimization",
      description: "AI-assisted coordination and assignment of field teams for maximum efficiency"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            className="text-center"
            variants={itemVariants}
          >
            <motion.div
              className="flex justify-center mb-8"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-4">
                <Brain size={60} className="text-purple-400" />
                <Shield size={80} className="text-indigo-400" />
                <Zap size={56} className="text-blue-400" />
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              AI-Powered Admin Portal
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Intelligent administrative tools for managing smart city operations and AI-driven civic services
            </p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={itemVariants}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition-all duration-300 shadow-xl"
                >
                  Access Dashboard
                  <ArrowRight size={20} className="ml-2" />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-4 bg-slate-600 text-white font-semibold rounded-2xl hover:bg-slate-700 transition-all duration-300"
                >
                  Create Account
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        className="py-24 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            variants={itemVariants}
          >
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              AI-Driven Administrative Capabilities
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Advanced tools powered by artificial intelligence for efficient civic management and service delivery
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 text-center"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon size={32} className="text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        className="py-24 bg-slate-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            variants={itemVariants}
          >
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              System Overview
            </h2>
            <p className="text-xl text-slate-600">
              Real-time insights into civic operations
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={itemVariants}
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon size={24} className="text-indigo-600" />
                  </div>
                  <div className="text-4xl font-bold text-slate-800 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-slate-600 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        className="py-24 bg-gradient-to-r from-indigo-600 to-slate-700 text-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="text-4xl font-bold mb-6"
            variants={itemVariants}
          >
            Ready to Lead AI-Driven City Management?
          </motion.h2>
          <motion.p
            className="text-xl text-indigo-100 mb-8"
            variants={itemVariants}
          >
            Join our administrative team and harness the power of AI to build a smarter, more efficient city
          </motion.p>
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-2xl hover:bg-slate-100 transition-all duration-300 shadow-xl"
            >
              Get Started
              <ArrowRight size={20} className="ml-2" />
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}