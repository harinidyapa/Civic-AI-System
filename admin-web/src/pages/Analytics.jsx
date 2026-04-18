import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, AlertTriangle, Brain, MapPin, Zap,
  Target, Activity, BarChart2, RefreshCw, ChevronUp, ChevronDown, Shield
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getAllIssues } from "../services/api";

const CATEGORY_COLORS = {
  Pothole: "#c0a060", Garbage: "#6aaa7a", Streetlight: "#c8b040",
  "Water Leakage": "#5090c0", Uncategorized: "#808898",
};
const URGENCY_COLORS = {
  Critical: "#c05050", High: "#c07840", Medium: "#b09030",
  Low: "#4878a8", "Very Low": "#707880",
};
const STATUS_COLORS = {
  pending: "#b09030", assigned: "#4878a8", in_progress: "#b07040",
  resolved: "#508860", rejected: "#a04848",
};

function getWeekLabel(dateStr) {
  const d = new Date(dateStr);
  return `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString("default", { month: "short" })}`;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function useIsTablet() {
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsTablet(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isTablet;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "linear-gradient(135deg,#1e2330,#252d3d)",
      border: "1px solid rgba(180,160,100,0.3)",
      borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
    }}>
      <p style={{ color: "#c8b06a", fontWeight: 700, fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: "#d0d8e8", fontSize: 11, margin: 0 }}>
          <span style={{ color: p.color }}>■</span> {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, accent, trend, delay = 0, compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      style={{
        background: "linear-gradient(145deg,#1a2035,#1e2640,#1a2035)",
        border: "1px solid rgba(180,160,100,0.2)",
        borderRadius: 16, padding: compact ? "14px 16px" : "20px 22px",
        position: "relative", overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.05)"
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg,transparent,rgba(200,176,106,0.4),transparent)"
      }} />
      <div style={{
        position: "absolute", top: -20, right: -20, width: 80, height: 80,
        background: accent, borderRadius: "50%", filter: "blur(30px)", opacity: 0.15
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: compact ? 10 : 14 }}>
        <div style={{
          background: `linear-gradient(135deg,${accent}33,${accent}11)`,
          border: `1px solid ${accent}44`, borderRadius: 10, padding: compact ? 6 : 8
        }}>
          <Icon size={compact ? 14 : 16} color={accent} />
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 2, color: trend >= 0 ? "#6aaa7a" : "#c05050" }}>
            {trend >= 0 ? <ChevronUp size={13} /> : <ChevronDown size={13} />}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: compact ? 22 : 28, fontWeight: 900, color: "#e8eaf0", letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: compact ? 10 : 12, fontWeight: 700, color: "#8090a8", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 10, color: "#505868", marginTop: 3 }}>{subtitle}</div>}
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, title, accent = "#c8b06a" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{
        background: `linear-gradient(135deg,${accent}33,${accent}11)`,
        border: `1px solid ${accent}44`, borderRadius: 8, padding: "6px 8px"
      }}>
        <Icon size={14} color={accent} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: "#c8d0e0", textTransform: "uppercase", letterSpacing: 1 }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(200,176,106,0.2),transparent)", marginLeft: 8 }} />
    </div>
  );
}

function getHeatmapClusters(issues) {
  const points = issues
    .filter(i => i.location?.lat && i.location?.lng)
    .map(i => ({
      lat: Number(i.location.lat),
      lng: Number(i.location.lng),
      category: i.category || "Uncategorized"
    }));

  const buckets = {};
  points.forEach((point) => {
    const latKey = Math.round(point.lat * 1000) / 1000;
    const lngKey = Math.round(point.lng * 1000) / 1000;
    const key = `${latKey}|${lngKey}`;
    if (!buckets[key]) {
      buckets[key] = { lat: latKey, lng: lngKey, count: 0, categories: {}, example: point };
    }
    buckets[key].count += 1;
    buckets[key].categories[point.category] = (buckets[key].categories[point.category] || 0) + 1;
  });

  return Object.values(buckets)
    .sort((a, b) => b.count - a.count)
    .slice(0, 16);
}

function getMapCenter(issues) {
  const locations = issues.filter(i => i.location?.lat && i.location?.lng);
  if (!locations.length) return [20.5, 78.9];
  const sum = locations.reduce((acc, issue) => {
    acc.lat += Number(issue.location.lat);
    acc.lng += Number(issue.location.lng);
    return acc;
  }, { lat: 0, lng: 0 });
  return [sum.lat / locations.length, sum.lng / locations.length];
}

function Panel({ children, style = {}, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{
        background: "linear-gradient(145deg,#161c2c,#1a2035,#161c2c)",
        border: "1px solid rgba(180,160,100,0.15)",
        borderRadius: 18, padding: 20,
        position: "relative", overflow: "hidden",
        boxShadow: "0 4px 32px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.04)",
        ...style
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg,transparent,rgba(200,176,106,0.3),transparent)"
      }} />
      {children}
    </motion.div>
  );
}

function PredictiveAlert({ alerts }) {
  if (!alerts.length) return (
    <Panel delay={0.3}>
      <SectionHeader icon={Brain} title="AI Predictive Alerts" accent="#a080e0" />
      <p style={{ color: "#505868", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
        No alerts. System operating normally.
      </p>
    </Panel>
  );
  return (
    <Panel delay={0.3}>
      <SectionHeader icon={Brain} title="AI Predictive Alerts" accent="#a080e0" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {alerts.map((alert, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            style={{
              background: alert.severity === "high"
                ? "linear-gradient(135deg,rgba(192,80,80,0.1),rgba(192,80,80,0.05))"
                : "linear-gradient(135deg,rgba(176,144,48,0.1),rgba(176,144,48,0.05))",
              border: `1px solid ${alert.severity === "high" ? "rgba(192,80,80,0.25)" : "rgba(176,144,48,0.2)"}`,
              borderRadius: 12, padding: "12px 14px",
              display: "flex", gap: 12, alignItems: "flex-start"
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: "50%", marginTop: 5, flexShrink: 0,
              background: alert.severity === "high" ? "#c05050" : alert.severity === "medium" ? "#b09030" : "#708830",
              boxShadow: `0 0 8px ${alert.severity === "high" ? "#c05050" : "#b09030"}`
            }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#c8d0e0", margin: "0 0 3px" }}>{alert.title}</p>
              <p style={{ fontSize: 11, color: "#607080", lineHeight: 1.5, margin: 0 }}>{alert.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Panel>
  );
}

export default function Analytics() {
  const [issues, setIssues]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const isMobile  = useIsMobile();
  const isTablet  = useIsTablet();
  const token = localStorage.getItem("token");

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllIssues(token);
      setIssues(res.data);
      setError(null);
    } catch (e) {
      setError("Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    const handleRefresh = () => fetchIssues();
    window.addEventListener("app-refresh", handleRefresh);
    return () => window.removeEventListener("app-refresh", handleRefresh);
  }, [fetchIssues]);

  const analytics = useMemo(() => {
    if (!issues.length) return null;
    const categoryCount = {};
    issues.forEach(i => { const c = i.category || "Uncategorized"; categoryCount[c] = (categoryCount[c] || 0) + 1; });
    const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const statusCount = {};
    issues.forEach(i => { statusCount[i.status] = (statusCount[i.status] || 0) + 1; });
    const statusData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));
    const weekMap = {};
    issues.forEach(issue => {
      const week = getWeekLabel(issue.createdAt);
      if (!weekMap[week]) weekMap[week] = { week, total: 0, resolved: 0 };
      weekMap[week].total++;
      if (issue.status === "resolved") weekMap[week].resolved++;
    });
    const weeklyData = Object.values(weekMap).slice(-8);
    const urgencyCount = {};
    issues.forEach(i => { const u = i.urgencyLabel || "Very Low"; urgencyCount[u] = (urgencyCount[u] || 0) + 1; });
    const urgencyData = Object.entries(urgencyCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const withAI = issues.filter(i => i.aiCategory && i.aiCategory !== "Uncategorized");
    const correct = withAI.filter(i => i.aiCategory === i.category);
    const aiAccuracy = withAI.length > 0 ? Math.round((correct.length / withAI.length) * 100) : 0;
    const miscategorized = issues.filter(i => i.is_miscategorized).length;
    const last7 = new Date(); last7.setDate(last7.getDate() - 7);
    const recentIssues = issues.filter(i => new Date(i.createdAt) >= last7);
    const areaCount = {};
    issues.forEach(i => { const area = i.location?.address || "Unknown"; areaCount[area] = (areaCount[area] || 0) + 1; });
    const hotspots = Object.entries(areaCount).map(([area, count]) => ({ area, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const resolved = issues.filter(i => i.status === "resolved");
    const avgResolutionDays = resolved.length > 0
      ? Math.round(resolved.reduce((s, i) => s + (new Date(i.updatedAt) - new Date(i.createdAt)) / (1000 * 60 * 60 * 24), 0) / resolved.length) : 0;
    const resolutionRate = issues.length > 0 ? Math.round((resolved.length / issues.length) * 100) : 0;
    const alerts = [];
    Object.entries(categoryCount).forEach(([cat, count]) => {
      const rc = recentIssues.filter(i => i.category === cat).length;
      const apd = count / 30; const rpd = rc / 7;
      if (rpd > apd * 1.5 && rc >= 2) alerts.push({ severity: "high", title: `${cat} reports spiking`, description: `${rc} reports in 7 days — ${Math.round((rpd / apd - 1) * 100)}% above baseline.` });
    });
    const criticalPending = issues.filter(i => (i.urgencyLabel === "Critical" || i.urgencyLabel === "High") && i.status === "pending").length;
    if (criticalPending > 0) alerts.push({ severity: "high", title: `${criticalPending} critical issues unassigned`, description: "High-urgency issues awaiting crew assignment." });
    if (hotspots[0]?.count >= 3) alerts.push({ severity: "medium", title: `Hotspot: ${hotspots[0].area}`, description: `${hotspots[0].count} recurring reports. Proactive inspection recommended.` });
    if (resolutionRate < 40 && issues.length > 5) alerts.push({ severity: "medium", title: "Resolution rate below target", description: `Current: ${resolutionRate}%. Consider more crew allocation.` });
    const withConfidence = issues.filter(i => i.aiConfidence > 0);
    const avgConfidence = withConfidence.length > 0 ? Math.round(withConfidence.reduce((s, i) => s + (i.aiConfidence || 0), 0) / withConfidence.length) : 0;
    return {
      categoryData, statusData, weeklyData, urgencyData,
      aiAccuracy, miscategorized, withAICount: withAI.length,
      hotspots, avgResolutionDays, alerts, resolutionRate,
      totalIssues: issues.length, pendingCount: statusCount["pending"] || 0,
      recentCount: recentIssues.length, avgConfidence
    };
  }, [issues]);

  const heatmapClusters = useMemo(() => getHeatmapClusters(issues), [issues]);
  const mapCenter = useMemo(() => getMapCenter(issues), [issues]);

  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(160deg,#0e1320,#111828,#0e1320)",
    padding: isMobile ? "16px 12px 48px" : "28px 28px 48px",
    fontFamily: "'DM Sans','Segoe UI',sans-serif"
  };

  if (loading) return (
    <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#c8b06a" }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontWeight: 600, fontSize: isMobile ? 11 : 14, letterSpacing: 1 }}>LOADING...</span>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error || !analytics) return (
    <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center", color: "#c05050" }}>
      {error || "No data available"}
    </div>
  );

  const {
    categoryData, statusData, weeklyData, urgencyData,
    aiAccuracy, miscategorized, withAICount,
    hotspots, avgResolutionDays, alerts, resolutionRate,
    totalIssues, pendingCount, recentCount, avgConfidence
  } = analytics;

  // Responsive grid helpers
  const gap = isMobile ? 12 : 20;
  const mb  = isMobile ? 12 : 20;

  return (
    <div style={pageStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0e1320; }
        ::-webkit-scrollbar-thumb { background: rgba(200,176,106,0.3); border-radius: 4px; }
      `}</style>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: isMobile ? 20 : 32
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            background: "linear-gradient(135deg,rgba(200,176,106,0.2),rgba(200,176,106,0.05))",
            border: "1px solid rgba(200,176,106,0.3)", borderRadius: 12, padding: 10, flexShrink: 0
          }}>
            <Shield size={isMobile ? 16 : 20} color="#c8b06a" />
          </div>
          <div>
            <h1 style={{
              fontSize: isMobile ? 15 : 22, fontWeight: 900, margin: 0, letterSpacing: -0.5,
              background: "linear-gradient(90deg,#e8e0d0,#c8b06a,#e8e0d0)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>
              CIVIC INTELLIGENCE DASHBOARD
            </h1>
            <p style={{ fontSize: isMobile ? 9 : 11, color: "#506070", margin: 0, letterSpacing: 1.2, textTransform: "uppercase" }}>
              Real-time analytics & predictive insights
            </p>
          </div>
        </div>
        <button onClick={fetchIssues} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "linear-gradient(135deg,rgba(200,176,106,0.15),rgba(200,176,106,0.05))",
          border: "1px solid rgba(200,176,106,0.3)", borderRadius: 10, padding: "8px 16px",
          color: "#c8b06a", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5,
          alignSelf: isMobile ? "flex-start" : "auto"
        }}>
          <RefreshCw size={12} /> REFRESH
        </button>
      </motion.div>

      {/* ── KPI Cards: 2 cols mobile, 4 cols desktop ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
        gap, marginBottom: mb
      }}>
        <StatCard title="Total Issues" value={totalIssues} subtitle={`${recentCount} this week`} icon={Activity} accent="#5090c0" delay={0.1} compact={isMobile} />
        <StatCard title="Pending" value={pendingCount} subtitle="Awaiting assignment" icon={AlertTriangle} accent="#c0902a" delay={0.15} compact={isMobile} />
        <StatCard title={isMobile ? "Resolution" : "Resolution Rate"} value={`${resolutionRate}%`} subtitle={`Avg ${avgResolutionDays}d`} icon={Target} accent="#508860" delay={0.2} compact={isMobile} />
        <StatCard title={isMobile ? "AI Accuracy" : "AI Accuracy"} value={`${aiAccuracy}%`} subtitle={`${withAICount} analyzed`} icon={Brain} accent="#8060c0" delay={0.25} compact={isMobile} />
      </div>

      {/* ── Alerts + Hotspots: stack on mobile ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap, marginBottom: mb
      }}>
        <PredictiveAlert alerts={alerts} />
        <Panel delay={0.35}>
          <SectionHeader icon={MapPin} title="Issue Hotspots" accent="#c05050" />
          {hotspots.length === 0
            ? <p style={{ color: "#506070", fontSize: 13 }}>No hotspot data yet.</p>
            : hotspots.map((h, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#8090a8", display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: 4, display: "inline-flex", flexShrink: 0,
                      alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800,
                      background: "rgba(200,176,106,0.15)", color: "#c8b06a"
                    }}>{i + 1}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.area}</span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#c05050", flexShrink: 0 }}>{h.count}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${(h.count / hotspots[0].count) * 100}%` }}
                    transition={{ duration: 0.9, delay: 0.5 + i * 0.1 }}
                    style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#c05050,#c07840)", boxShadow: "0 0 8px rgba(192,80,80,0.4)" }}
                  />
                </div>
              </div>
            ))
          }
        </Panel>
      </div>

      <Panel delay={0.4} style={{ marginBottom: mb }}>
        <SectionHeader icon={MapPin} title="Geospatial Hotspot Map" accent="#c05050" />
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16 }}>
          <div style={{ flex: 1, minHeight: 320, borderRadius: 16, overflow: "hidden", background: "#0f172a" }}>
            <MapContainer center={mapCenter} zoom={isMobile ? 6 : 8} scrollWheelZoom={true} style={{ width: "100%", height: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {heatmapClusters.map((cluster, idx) => {
                const intensity = Math.min(1, cluster.count / 10);
                const color = intensity > 0.7 ? "#d9534f" : intensity > 0.4 ? "#f0ad4e" : "#5bc0de";
                return (
                  <CircleMarker
                    key={idx}
                    center={[cluster.lat, cluster.lng]}
                    radius={8 + cluster.count * 2}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.35,
                      weight: 1
                    }}
                  >
                    <LeafletTooltip direction="top" offset={[0, -8]} opacity={0.9}>
                      <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                        <strong>{cluster.count} issue{cluster.count > 1 ? "s" : ""}</strong><br />
                        {Object.entries(cluster.categories).sort((a,b)=>b[1]-a[1]).map(([name, value]) => `${name}: ${value}`).join(" • ")}
                      </div>
                    </LeafletTooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          <div style={{ width: isMobile ? "100%" : 300, display: "grid", gap: 12 }}>
            <div style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 12, color: "#8090a8", fontWeight: 700, marginBottom: 8 }}>MAP SUMMARY</div>
              <div style={{ fontSize: 16, color: "#e8eaf0", fontWeight: 700, marginBottom: 10 }}>{heatmapClusters.length} hotspot zones</div>
              <div style={{ fontSize: 13, color: "#b0bed6", lineHeight: 1.6 }}>
                The map aggregates nearby issue reports into dynamic hotspots so you can quickly see where crew attention is needed most.
              </div>
            </div>
            <div style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 12, color: "#8090a8", fontWeight: 700, marginBottom: 8 }}>TOP LOCATIONS</div>
              {heatmapClusters.slice(0, 5).map((cluster, index) => (
                <div key={index} style={{ marginBottom: index < 4 ? 12 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ color: "#e8eaf0", fontWeight: 700, fontSize: 13 }}>Zone {index + 1}</span>
                    <span style={{ color: "#f0ad4e", fontWeight: 700, fontSize: 13 }}>{cluster.count}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#aac0d8", marginTop: 4 }}>
                    {Object.entries(cluster.categories).sort((a,b)=>b[1]-a[1]).map(([name, value]) => `${name} (${value})`).join(" • ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Weekly Trend ── */}
      <Panel delay={0.4} style={{ marginBottom: mb }}>
        <SectionHeader icon={TrendingUp} title="Weekly Issue Trend" accent="#5090c0" />
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5090c0" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#5090c0" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#508860" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#508860" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="week" tick={{ fontSize: isMobile ? 8 : 10, fill: "#506070" }} axisLine={false} tickLine={false} interval={isMobile ? 1 : 0} />
            <YAxis tick={{ fontSize: isMobile ? 8 : 10, fill: "#506070" }} axisLine={false} tickLine={false} width={24} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 11, color: "#8090a8" }} />
            <Area type="monotone" dataKey="total" name="Total" stroke="#5090c0" fill="url(#gTotal)" strokeWidth={2} dot={{ r: isMobile ? 2 : 3, fill: "#5090c0" }} />
            <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#508860" fill="url(#gResolved)" strokeWidth={2} dot={{ r: isMobile ? 2 : 3, fill: "#508860" }} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      {/* ── Category + Urgency + Status:
            mobile  → 1 col
            tablet  → 2 col (status goes full width)
            desktop → 3 col ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr",
        gap, marginBottom: mb
      }}>
        <Panel delay={0.45}>
          <SectionHeader icon={BarChart2} title="By Category" accent="#c0a060" />
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                innerRadius={isMobile ? 35 : 45} outerRadius={isMobile ? 60 : 72}
                paddingAngle={3}
                label={({ percent }) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ""}
                labelLine={false}
              >
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#808898"} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#8090a8" }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel delay={0.5}>
          <SectionHeader icon={Zap} title="Urgency Levels" accent="#c07840" />
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={urgencyData} layout="vertical" margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: "#506070" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "#8090a8" }} width={52} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Issues" radius={[0, 4, 4, 0]}>
                {urgencyData.map((entry) => (
                  <Cell key={entry.name} fill={URGENCY_COLORS[entry.name] || "#808898"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Status: spans full width on tablet, normal on others */}
        <Panel delay={0.55} style={isTablet && !isMobile ? { gridColumn: "1 / -1" } : {}}>
          <SectionHeader icon={Activity} title="Status Pipeline" accent="#508860" />
          <div style={{
            display: isTablet && !isMobile ? "grid" : "block",
            gridTemplateColumns: isTablet && !isMobile ? "repeat(3,1fr)" : undefined,
            gap: isTablet && !isMobile ? "0 24px" : undefined
          }}>
            {statusData.map((s, i) => (
              <div key={s.name} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#8090a8", textTransform: "capitalize" }}>
                    {s.name.replace("_", " ")}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#c8d0e0" }}>{s.value}</span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${(s.value / totalIssues) * 100}%` }}
                    transition={{ duration: 0.9, delay: 0.6 + i * 0.08 }}
                    style={{
                      height: "100%", borderRadius: 4,
                      background: STATUS_COLORS[s.name] || "#808898",
                      boxShadow: `0 0 8px ${STATUS_COLORS[s.name] || "#808898"}66`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── AI Performance: 2 cols mobile, 4 cols desktop ── */}
      <Panel delay={0.6}>
        <SectionHeader icon={Brain} title="AI Model Performance" accent="#8060c0" />
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
          gap: isMobile ? 10 : 16
        }}>
          {[
            { label: "Category Accuracy", value: `${aiAccuracy}%`, accent: "#8060c0", sub: "AI vs citizen" },
            { label: "Issues Analyzed", value: withAICount, accent: "#5090c0", sub: "Classifications" },
            { label: "Miscategorized", value: miscategorized, accent: "#c05050", sub: "Needs review" },
            { label: "Avg Confidence", value: `${avgConfidence}%`, accent: "#508860", sub: "Certainty" },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              style={{
                background: `linear-gradient(135deg,${item.accent}15,${item.accent}05)`,
                border: `1px solid ${item.accent}30`,
                borderRadius: 14, padding: isMobile ? "14px 10px" : "18px 16px", textAlign: "center",
                position: "relative", overflow: "hidden"
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg,transparent,${item.accent}50,transparent)`
              }} />
              <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: item.accent, letterSpacing: -1 }}>{item.value}</div>
              <div style={{ fontSize: isMobile ? 9 : 11, fontWeight: 700, color: "#8090a8", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.6 }}>{item.label}</div>
              <div style={{ fontSize: 10, color: "#405060", marginTop: 3 }}>{item.sub}</div>
            </motion.div>
          ))}
        </div>
      </Panel>
    </div>
  );
}