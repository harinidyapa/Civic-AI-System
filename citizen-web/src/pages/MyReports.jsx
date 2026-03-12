import { useEffect, useState } from "react";
import { getMyReports } from "../services/api";
import { FileText, MapPin, CheckCircle, Clock, AlertCircle, Images, XCircle, Loader2, Tag, AlertTriangle } from "lucide-react";

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
    <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</span>
        <span className="text-xs font-bold" style={{ color: text }}>{label} · {s}/5</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(s/5)*100}%`, background: `linear-gradient(90deg, ${bar}99, ${bar})`, boxShadow: `0 0 6px ${bar}44` }} />
      </div>
      <div className="flex justify-between mt-1">
        {[1,2,3,4,5].map(n => (
          <span key={n} className="text-[9px]" style={{ color: n <= s ? text : "#cbd5e1" }}>●</span>
        ))}
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  pending:     { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  assigned:    { color: "bg-blue-100 text-blue-800",    icon: Tag },
  in_progress: { color: "bg-orange-100 text-orange-800",icon: Loader2 },
  resolved:    { color: "bg-green-100 text-green-800",  icon: CheckCircle },
  rejected:    { color: "bg-red-100 text-red-800",      icon: XCircle },
};

function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getMyReports();
      setReports(res.data);
      setError(null);
    } catch (error) {
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
            <div className="bg-emerald-600 rounded-full p-2">
              <FileText size={28} className="text-white" />
            </div>
            My Reports
          </h2>
          <p className="text-slate-600 mt-2">Track all your submitted issues and their status</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
            <button onClick={fetchReports} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
              Try Again
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
            <p className="text-slate-600 mt-4">Loading your reports...</p>
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 border border-slate-200 text-center">
            <div className="inline-block mb-4 p-3 bg-slate-100 rounded-full">
              <FileText size={28} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Reports Yet</h3>
            <p className="text-slate-600">You haven't submitted any reports yet.</p>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="grid gap-6">
            {reports.map((report) => {
              const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const severity = report.aiSeverityScore || report.severityScore || 1;

              return (
                <div key={report._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">{report.title}</h3>
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                          <MapPin size={14} />
                          <span>{report.location?.address || `${report.location?.lat?.toFixed(4)}, ${report.location?.lng?.toFixed(4)}`}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 ${statusCfg.color}`}>
                        <StatusIcon size={13} />
                        {report.status?.replace("_", " ") || "Pending"}
                      </span>
                    </div>

                    {/* Category + Urgency */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                        {report.category}
                        {report.customCategory && ` · ${report.customCategory}`}
                      </span>
                      {report.urgencyLabel && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-sm font-medium">
                          <AlertTriangle size={12} />
                          {report.urgencyLabel}
                        </span>
                      )}
                    </div>

                    {/* Severity bar */}
                    <div className="mb-4">
                      <SeverityBar score={severity} />
                    </div>

                    {/* Description */}
                    <p className="text-slate-700 mb-4 leading-relaxed">{report.description}</p>

                    {/* Images */}
                    {report.images?.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Images size={16} className="text-slate-500" />
                          <span className="text-sm font-medium text-slate-600">
                            {report.images.length} image{report.images.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {report.images.map((image, idx) => (
                            <div key={idx} className="relative group overflow-hidden rounded-lg">
                              <img src={image} alt={`Issue ${idx+1}`}
                                className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activity log - latest update */}
                    {report.activityLog?.length > 0 && (() => {
                      const last = report.activityLog[report.activityLog.length - 1];
                      return last?.comment ? (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                          <p className="text-xs font-semibold text-blue-600 mb-1">Latest Update</p>
                          <p className="text-sm text-blue-800">{last.comment}</p>
                        </div>
                      ) : null;
                    })()}

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row gap-4 text-xs text-slate-500 border-t border-slate-100 pt-4">
                      <span><strong>Submitted:</strong> {new Date(report.createdAt).toLocaleDateString()}</span>
                      {report.updatedAt && (
                        <span><strong>Updated:</strong> {new Date(report.updatedAt).toLocaleDateString()}</span>
                      )}
                      {report.aiCategory && report.aiCategory !== "Uncategorized" && (
                        <span className="text-violet-500"><strong>AI detected:</strong> {report.aiCategory} ({report.aiConfidence}% conf.)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyReports;