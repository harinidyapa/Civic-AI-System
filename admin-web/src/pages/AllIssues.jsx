import { useEffect, useState } from "react";
import { getAllIssues, assignIssue, getCrews } from "../services/api";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

function SeverityBar({ score, compact = false }) {
  const s = Math.min(5, Math.max(1, score || 1));
  const getColor = (s) => {
    if (s >= 5) return { bar: "#dc2626", text: "#dc2626", label: "Critical" };
    if (s >= 4) return { bar: "#ea580c", text: "#ea580c", label: "High" };
    if (s >= 3) return { bar: "#ca8a04", text: "#ca8a04", label: "Medium" };
    if (s >= 2) return { bar: "#2563eb", text: "#2563eb", label: "Low" };
    return       { bar: "#64748b", text: "#64748b", label: "Very Low" };
  };
  const { bar, text, label } = getColor(s);
  if (compact) return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(s/5)*100}%`, background: bar }} />
      </div>
      <span className="text-xs font-bold flex-shrink-0" style={{ color: text }}>{label} {s}/5</span>
    </div>
  );
  return (
    <div className="mt-2">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Severity</span>
        <span className="text-xs font-bold" style={{ color: text }}>{label} · {s}/5</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(s/5)*100}%`, background: `linear-gradient(90deg,${bar}99,${bar})`, boxShadow: `0 0 5px ${bar}44` }} />
      </div>
    </div>
  );
}

const statusClasses = (status) => {
  switch ((status||"").toLowerCase()) {
    case "pending":     return "text-yellow-600 bg-yellow-100";
    case "assigned":    return "text-blue-600 bg-blue-100";
    case "in_progress": return "text-orange-600 bg-orange-100";
    case "resolved":    return "text-green-600 bg-green-100";
    case "rejected":    return "text-red-600 bg-red-100";
    default:            return "text-slate-600 bg-slate-100";
  }
};

export default function AllIssues() {
  const [issues, setIssues]           = useState([]);
  const [crews, setCrews]             = useState([]);
  const [assignModalIssue, setAssignModalIssue] = useState(null);
  const [chosenCrewId, setChosenCrewId] = useState("");
  const [activeTab, setActiveTab]     = useState("pending");
  const token   = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allRes, crewsRes] = await Promise.all([getAllIssues(token, false), getCrews(token)]);
        setIssues(allRes.data);
        setCrews(crewsRes.data);
      } catch (err) { alert("Failed to fetch data"); }
    };
    fetchData();
  }, [token]);

  const handleAssign = async (issueId, crewId) => {
    try {
      await assignIssue(issueId, crewId, token);
      setIssues(prev => prev.map(iss => iss._id === issueId ? { ...iss, status: "assigned", assignedTo: crewId } : iss));
      setAssignModalIssue(null); setChosenCrewId("");
    } catch (err) { alert("Failed to assign issue"); }
  };

  const TABS = [
    { key: "pending", label: "Pending" },
    { key: "assigned", label: "Assigned" },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved", label: "Resolved" },
    { key: "rejected", label: "Rejected" },
  ];

  const filtered = issues.filter(i => (i.status || "").replace(" ", "_") === activeTab);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Issue Management</h1>

      {/* Tabs */}
      <div className="mb-6">
        <div className="hidden md:flex gap-2 border-b">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 font-semibold transition-colors text-sm ${
                activeTab === tab.key ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-800"
              }`}>
              {tab.label} ({issues.filter(i => (i.status||"").replace(" ","_") === tab.key).length})
            </button>
          ))}
        </div>
        <select value={activeTab} onChange={e => setActiveTab(e.target.value)}
          className="md:hidden w-full p-3 rounded-xl border border-slate-300 bg-white">
          {TABS.map(tab => <option key={tab.key} value={tab.key}>{tab.label} ({issues.filter(i => (i.status||"").replace(" ","_") === tab.key).length})</option>)}
        </select>
      </div>

      {/* Issue cards */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No issues in this category</div>
        ) : filtered.map(issue => {
          const severity = issue.aiSeverityScore || issue.severityScore || 1;
          return (
            <div key={issue._id} onClick={() => navigate(`/issues/${issue._id}`)}
              className="bg-white rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow border border-slate-100">
              <div className="flex justify-between items-start gap-3 mb-2">
                <h2 className="text-lg font-semibold text-slate-800 truncate flex-1">{issue.title}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusClasses(issue.status)}`}>
                  {issue.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-2 text-sm text-slate-600">
                <span className="bg-slate-100 rounded-full px-2.5 py-0.5 text-xs font-medium">
                  {issue.category}{issue.customCategory ? ` · ${issue.customCategory}` : ""}
                </span>
                {issue.urgencyLabel && (
                  <span className="bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-2.5 py-0.5 text-xs font-medium flex items-center gap-1">
                    <AlertTriangle size={10} />{issue.urgencyLabel}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mb-1">By: {issue.reportedBy?.name} · Assigned: {issue.assignedTo?.name || "—"}</p>

              {/* Severity bar */}
              <SeverityBar score={severity} compact />

              {/* Last activity */}
              {issue.activityLog?.length > 0 && (() => {
                const last = issue.activityLog[issue.activityLog.length - 1];
                return last?.crewNote || last?.rejectionReason ? (
                  <p className="text-xs text-red-500 mt-2">
                    {last.crewNote && `Note: ${last.crewNote}`}
                    {last.rejectionReason && `Rejected: ${last.rejectionReason}`}
                  </p>
                ) : null;
              })()}

              <div className="flex justify-between items-center mt-3">
                {activeTab === "pending" && (
                  <button className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 transition"
                    onClick={e => { e.stopPropagation(); setAssignModalIssue(issue); setChosenCrewId(""); }}>
                    Assign Crew
                  </button>
                )}
                {activeTab === "assigned" && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-medium">Awaiting crew</span>
                )}
                <span className="text-xs text-slate-400 ml-auto">{new Date(issue.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign modal */}
      {assignModalIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Assign Crew</h2>
              <button onClick={() => setAssignModalIssue(null)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <p className="mb-4 text-sm text-slate-600">Issue: <strong>{assignModalIssue.title}</strong></p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {crews.map(crew => (
                <label key={crew._id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${chosenCrewId === crew._id ? "border-green-400 bg-green-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <input type="radio" name="crew" value={crew._id} checked={chosenCrewId === crew._id} onChange={() => setChosenCrewId(crew._id)} className="accent-green-600" />
                  <span className="font-medium text-slate-700">{crew.name}</span>
                </label>
              ))}
            </div>
            <button disabled={!chosenCrewId} onClick={() => handleAssign(assignModalIssue._id, chosenCrewId)}
              className={`w-full py-2.5 rounded-xl text-white font-semibold ${chosenCrewId ? "bg-green-600 hover:bg-green-700" : "bg-slate-300 cursor-not-allowed"}`}>
              Confirm Assignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}