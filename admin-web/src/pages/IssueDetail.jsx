import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllIssues } from "../services/api";
import { ArrowLeft, MapPin, User, Tag, Clock, Brain, AlertTriangle } from "lucide-react";

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
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">Severity Score</span>
        <span className="text-sm font-black" style={{ color: text }}>{label} — {s} / 5</span>
      </div>
      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(s/5)*100}%`, background: `linear-gradient(90deg,${bar}99,${bar})`, boxShadow: `0 0 8px ${bar}55` }} />
      </div>
      <div className="flex justify-between mt-1.5">
        {[1,2,3,4,5].map(n => (
          <span key={n} className="text-xs" style={{ color: n <= s ? text : "#cbd5e1", fontWeight: 700 }}>●</span>
        ))}
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  pending:     "bg-yellow-100 text-yellow-700",
  assigned:    "bg-blue-100 text-blue-700",
  in_progress: "bg-orange-100 text-orange-700",
  resolved:    "bg-green-100 text-green-700",
  rejected:    "bg-red-100 text-red-700",
};

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAllIssues(localStorage.getItem("token"));
        const found = res.data.find(i => i._id === id);
        setIssue(found);
      } catch (err) { console.error(err); }
    };
    load();
  }, [id]);

  if (!issue) return <div className="p-8 text-slate-600">Loading...</div>;

  const severity = issue.aiSeverityScore || issue.severityScore || 1;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-2">
          <ArrowLeft size={20} /> Back
        </button>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold text-slate-800 flex-1">{issue.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 ${STATUS_COLORS[issue.status] || "bg-slate-100 text-slate-700"}`}>
              {issue.status?.replace("_", " ")}
            </span>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Tag size={14} className="text-slate-400" />
              <span>{issue.category}{issue.customCategory ? ` · ${issue.customCategory}` : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin size={14} className="text-slate-400" />
              <span className="truncate">{issue.location?.address || `${issue.location?.lat?.toFixed(4)}, ${issue.location?.lng?.toFixed(4)}`}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <User size={14} className="text-slate-400" />
              <span>By: {issue.reportedBy?.name || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <User size={14} className="text-slate-400" />
              <span>Assigned: {issue.assignedTo?.name || "—"}</span>
            </div>
            {issue.urgencyLabel && (
              <div className="flex items-center gap-2 col-span-2">
                <AlertTriangle size={14} className="text-orange-400" />
                <span className="text-orange-600 font-medium">{issue.urgencyLabel} Urgency</span>
                {issue.urgencyKeywords?.length > 0 && (
                  <span className="text-xs text-slate-400">· {issue.urgencyKeywords.join(", ")}</span>
                )}
              </div>
            )}
          </div>

          {/* Severity */}
          <div className="mb-5">
            <SeverityBar score={severity} />
          </div>

          {/* Description */}
          <p className="text-slate-700 leading-relaxed mb-5">{issue.description}</p>

          {/* Images */}
          {issue.images?.length > 0 && (
            <div className="space-y-3 mb-5">
              {issue.images.map((img, idx) => (
                <img key={idx} src={img} alt="Issue" className="w-full rounded-xl object-cover" />
              ))}
            </div>
          )}
        </div>

        {/* AI Info panel */}
        {issue.aiCategory && (
          <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} className="text-violet-500" />
              <h2 className="font-bold text-slate-700">AI Analysis</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "AI Category", value: issue.aiCategory },
                { label: "Confidence", value: `${issue.aiConfidence || 0}%` },
                { label: "AI Severity", value: `${issue.aiSeverityScore || "—"}/5` },
                { label: "Miscategorized", value: issue.is_miscategorized ? "Yes ⚠" : "No ✓" },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p className="font-bold text-slate-800 text-sm">{item.value}</p>
                </div>
              ))}
            </div>
            {issue.aiGeneratedDescription && (
              <div className="mt-4 p-3 bg-violet-50 rounded-xl border border-violet-100">
                <p className="text-xs font-semibold text-violet-600 mb-1">AI Generated Description</p>
                <p className="text-sm text-slate-700">{issue.aiGeneratedDescription}</p>
              </div>
            )}
          </div>
        )}

        {/* Activity log */}
        {issue.activityLog?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-slate-400" />
              <h2 className="font-bold text-slate-700">Activity Log</h2>
            </div>
            <div className="space-y-3">
              {issue.activityLog.map((log, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-700 capitalize">{log.status?.replace("_", " ")}</span>
                    <span className="text-slate-400 text-xs ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                    {log.comment && <p className="text-slate-600 mt-0.5">{log.comment}</p>}
                    {log.rejectionReason && <p className="text-red-500 mt-0.5">Reason: {log.rejectionReason}</p>}
                    {log.crewNote && <p className="text-orange-500 mt-0.5">Note: {log.crewNote}</p>}
                    {log.evidenceImages?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {log.evidenceImages.map((img, j) => (
                          <img key={j} src={img} alt="evidence" className="w-16 h-16 object-cover rounded-lg" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}