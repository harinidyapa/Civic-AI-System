import { useNavigate } from "react-router-dom";
import { MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Loader2, Tag } from "lucide-react";

function SeverityBar({ score }) {
  const s = Math.min(5, Math.max(1, score || 1));
  const getColor = (s) => {
    if (s >= 5) return { bar: "#dc2626", text: "#dc2626", label: "Critical" };
    if (s >= 4) return { bar: "#ea580c", text: "#ea580c", label: "High" };
    if (s >= 3) return { bar: "#ca8a04", text: "#ca8a04", label: "Medium" };
    if (s >= 2) return { bar: "#2563eb", text: "#2563eb", label: "Low" };
    return       { bar: "#64748b", text: "#64748b", label: "Very Low" };
  };
  const { bar, text, label } = getColor(s);
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</span>
        <span className="text-xs font-bold" style={{ color: text }}>{label} · {s}/5</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(s / 5) * 100}%`, background: `linear-gradient(90deg, ${bar}aa, ${bar})`, boxShadow: `0 0 6px ${bar}55` }}
        />
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  pending:     { color: "bg-yellow-100 text-yellow-700", icon: Clock },
  assigned:    { color: "bg-blue-100 text-blue-700",    icon: Tag },
  in_progress: { color: "bg-orange-100 text-orange-700",icon: Loader2 },
  resolved:    { color: "bg-green-100 text-green-700",  icon: CheckCircle },
  rejected:    { color: "bg-red-100 text-red-700",      icon: XCircle },
};

const CATEGORY_COLORS = {
  Pothole:        "bg-amber-50 text-amber-700 border-amber-200",
  Garbage:        "bg-green-50 text-green-700 border-green-200",
  Streetlight:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Water Leakage":"bg-blue-50 text-blue-700 border-blue-200",
};

export default function IssueCard({ issue }) {
  const navigate = useNavigate();
  const statusCfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const catColor = CATEGORY_COLORS[issue.category] || "bg-slate-50 text-slate-700 border-slate-200";
  const severity = issue.aiSeverityScore || issue.severityScore || 1;

  return (
    <div
      onClick={() => navigate(`/issues/${issue._id}`)}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2 flex-1">{issue.title}</h3>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusCfg.color}`}>
          <StatusIcon size={11} />
          {issue.status?.replace("_", " ")}
        </span>
      </div>

      {/* Category + Urgency */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${catColor}`}>
          {issue.category}
        </span>
        {issue.urgencyLabel && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5">
            <AlertTriangle size={10} />
            {issue.urgencyLabel}
          </span>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
        <MapPin size={12} className="text-slate-400 flex-shrink-0" />
        <span className="truncate">{issue.location?.address || `${issue.location?.lat?.toFixed(4)}, ${issue.location?.lng?.toFixed(4)}`}</span>
      </div>

      {/* Severity bar */}
      <SeverityBar score={severity} />

      {/* Image thumbnail if exists */}
      {issue.images?.[0] && (
        <div className="mt-3 rounded-xl overflow-hidden h-32">
          <img src={issue.images[0]} alt="issue" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
        <span className="text-xs text-slate-400">{new Date(issue.createdAt).toLocaleDateString()}</span>
        {issue.aiCategory && issue.aiCategory !== "Uncategorized" && (
          <span className="text-xs text-violet-500 font-medium">AI: {issue.aiCategory}</span>
        )}
      </div>
    </div>
  );
}