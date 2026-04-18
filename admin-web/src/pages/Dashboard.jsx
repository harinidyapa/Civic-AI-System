import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import AllIssues from "./AllIssues";
import Analytics from "./Analytics";
import CrewManagement from "./CrewManagement";
import { getAllIssues, getCrews } from "../services/api";
import { FileText, AlertTriangle, Users, TrendingUp, Clock, CheckCircle, Brain, Zap, BarChart3 } from "lucide-react";

export default function Dashboard() {
  const [activePage, setActivePage] = useState("allissues");
  const [stats, setStats] = useState({
    totalIssues: 0,
    pendingIssues: 0,
    resolvedIssues: 0,
    activeCrew: 0
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const [issuesRes, crewsRes] = await Promise.all([
          getAllIssues(token, false),
          getCrews(token)
        ]);

        const issues = issuesRes.data || [];
        const crews = crewsRes.data || [];

        const pendingIssues = issues.filter((issue) => issue.status === "pending").length;
        const resolvedIssues = issues.filter((issue) => issue.status === "resolved").length;

        setStats({
          totalIssues: issues.length,
          pendingIssues,
          resolvedIssues,
          activeCrew: crews.length
        });
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      }
    };

    fetchDashboardStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const statsCards = [
    {
      title: "Total Issues",
      value: stats.totalIssues,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-indigo-100",
      borderColor: "border-blue-200",
      description: "All reported civic issues"
    },
    {
      title: "Pending Issues",
      value: stats.pendingIssues,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-100",
      borderColor: "border-amber-200",
      description: "Awaiting crew assignment"
    },
    {
      title: "Resolved Issues",
      value: stats.resolvedIssues,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-green-100",
      borderColor: "border-emerald-200",
      description: "Successfully completed"
    },
    {
      title: "Active Crew",
      value: stats.activeCrew,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-100",
      borderColor: "border-purple-200",
      description: "Field teams on duty"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar setActivePage={setActivePage} activePage={activePage} />

      {activePage === "allissues" && (
        <motion.div
          className="flex-1 p-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* AI-Powered Header */}
          <motion.div
            className="mb-8 text-center"
            variants={itemVariants}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="text-purple-600" size={32} />
              <Zap className="text-blue-600" size={28} />
              <BarChart3 className="text-emerald-600" size={30} />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              AI-Driven Civic Management
            </h1>
            <p className="text-slate-600 text-lg">
              Intelligent oversight of crowd-sourced issue reporting and resolution
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            variants={itemVariants}
          >
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  className={`backdrop-blur-md bg-white/70 border ${stat.borderColor} rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 text-center relative overflow-hidden`}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`absolute inset-0 ${stat.bgColor} opacity-50`}></div>
                  <div className="relative z-10">
                    <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg`}>
                      <Icon size={28} className={stat.color} />
                    </div>
                    <div className="text-4xl font-bold text-slate-800 mb-2">{stat.value}</div>
                    <div className="text-slate-700 font-semibold mb-1">{stat.title}</div>
                    <div className="text-slate-500 text-sm">{stat.description}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Issues Management */}
          <motion.div variants={itemVariants}>
            <AllIssues />
          </motion.div>
        </motion.div>
      )}

      {activePage === "analytics" && (
        <motion.div
          className="flex-1 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Analytics />
        </motion.div>
      )}

      {activePage === "crew" && (
        <motion.div
          className="flex-1 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CrewManagement />
        </motion.div>
      )}
    </div>
  );
}