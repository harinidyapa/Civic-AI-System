import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAssignedIssues, updateIssueStatus, getRAGSuggestion } from "../services/api";
import {
  ArrowLeft, CheckCircle, XCircle, AlertCircle,
  X, Trash2, Brain, Lightbulb, Clock, Wrench,
  ShieldAlert, ChevronDown, ChevronUp, Loader2, BookOpen, AlertTriangle
} from "lucide-react";
import imageCompression from "browser-image-compression";

// ── RAG Suggestion Panel ──────────────────────────
function RAGSuggestionPanel({ issueId }) {
  const [suggestion, setSuggestion]   = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [expanded, setExpanded]       = useState(true);
  const [fetched, setFetched]         = useState(false);

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRAGSuggestion(issueId);
      setSuggestion(res.data);
      setFetched(true);

      if (res.data?.error && !res.data?.suggestion) {
        setError(res.data.error);
      }
    } catch (e) {
      console.error("RAG suggestion request failed:", e);
      const errorMessage = e?.response?.data?.error || e?.message || "Could not load suggestion. Try again.";
      // Check for quota exceeded or service unavailable
      if (errorMessage.includes("quota") || errorMessage.includes("429") || errorMessage.includes("unreachable")) {
        setError("AI service temporarily unavailable. Showing standard resolution procedure.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) fetchSuggestion();
  }, [issueId]);

  const apiResponse = suggestion ?? {};
  const ragPayload = apiResponse.suggestion ?? apiResponse;
  const similarCount = apiResponse.similar_count ?? 0;

  const hasSuggestion = !!ragPayload;

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f1729 0%, #131d30 100%)",
      border: "1px solid rgba(139,92,246,0.25)",
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 24,
      boxShadow: "0 4px 24px rgba(0,0,0,0.2)"
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", cursor: "pointer",
          background: "linear-gradient(90deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))",
          borderBottom: expanded ? "1px solid rgba(139,92,246,0.15)" : "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 8, padding: "5px 7px"
          }}>
            <Brain size={15} color="#a78bfa" />
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#c4b5fd", letterSpacing: 0.5 }}>
              AI RESOLUTION GUIDE
            </span>
            {suggestion?.note && (
              <span style={{
                marginLeft: 8, fontSize: 10, color: "#fbbf24",
                background: "rgba(251,191,36,0.1)", padding: "2px 7px",
                borderRadius: 20, border: "1px solid rgba(251,191,36,0.2)"
              }}>
                Standard Procedure
              </span>
            )}
            {suggestion?.similar_count > 0 && !suggestion?.note && (
              <span style={{
                marginLeft: 8, fontSize: 10, color: "#7c6fad",
                background: "rgba(139,92,246,0.1)", padding: "2px 7px",
                borderRadius: 20, border: "1px solid rgba(139,92,246,0.2)"
              }}>
                Based on {suggestion.similar_count} past case{suggestion.similar_count > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} color="#7c6fad" /> : <ChevronDown size={16} color="#7c6fad" />}
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: "16px 18px" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#7c6fad", padding: "12px 0" }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 12, letterSpacing: 0.5 }}>Retrieving similar cases & generating guide...</span>
              <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
            </div>
          )}

          {error && !loading && (
            <div style={{ color: "#f87171", fontSize: 12, padding: "8px 0" }}>
              {error}
              <button onClick={fetchSuggestion} style={{
                marginLeft: 10, color: "#a78bfa", background: "none",
                border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600
              }}>Retry</button>
            </div>
          )}

          {fetched && !loading && !error && !hasSuggestion && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: 10, padding: "10px 14px",
              display: "flex", gap: 10, alignItems: "flex-start"
            }}>
              <AlertTriangle size={14} color="#f87171" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#fca5a5", margin: 0, lineHeight: 1.6 }}>
                {error || "AI returned no suggestion for this issue. Please refresh or try again."}
              </p>
            </div>
          )}

          {hasSuggestion && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {ragPayload.summary && (
                <div style={{
                  background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)",
                  borderRadius: 10, padding: "10px 14px",
                  display: "flex", gap: 10, alignItems: "flex-start"
                }}>
                  <Lightbulb size={14} color="#a78bfa" style={{ marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "#c4b5fd", margin: 0, lineHeight: 1.6 }}>
                    {ragPayload.summary}
                  </p>
                </div>
              )}

              {ragPayload.steps?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                    Resolution Steps
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {ragPayload.steps.map((step, i) => (
                      <div key={i} style={{
                        display: "flex", gap: 10, alignItems: "flex-start",
                        background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 12px"
                      }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 800, color: "#a78bfa"
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {ragPayload.materials?.length > 0 && (
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                      <Wrench size={12} color="#60a5fa" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 0.8 }}>Materials</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {ragPayload.materials.map((m, i) => (
                        <span key={i} style={{
                          fontSize: 10, color: "#9ca3af",
                          background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)",
                          borderRadius: 6, padding: "2px 7px"
                        }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}
                {ragPayload.estimated_time && (
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                      <Clock size={12} color="#34d399" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#34d399", textTransform: "uppercase", letterSpacing: 0.8 }}>Est. Time</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#6ee7b7" }}>{ragPayload.estimated_time}</span>
                  </div>
                )}
              </div>

              {ragPayload.safety_note && (
                <div style={{
                  background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 10, padding: "10px 14px",
                  display: "flex", gap: 10, alignItems: "flex-start"
                }}>
                  <ShieldAlert size={13} color="#f87171" style={{ marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: "#fca5a5", margin: 0, lineHeight: 1.5 }}>
                    <strong>Safety:</strong> {ragPayload.safety_note}
                  </p>
                </div>
              )}

              {suggestion?.similar_issues?.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
                  <p style={{ fontSize: 10, color: "#4b5563", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <BookOpen size={10} /> Retrieved from {suggestion.similar_issues.length} past resolved case{suggestion.similar_issues.length > 1 ? "s" : ""}
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {suggestion.similar_issues.map((s, i) => (
                      <span key={i} style={{
                        fontSize: 10, color: "#6b7280",
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 6, padding: "2px 8px"
                      }}>{s.title}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasSuggestion && similarCount === 0 && !loading && (
            <p style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>
              No similar past cases found — suggestion generated from AI expertise only.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────
export default function IssueDetail() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [comment, setComment] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidencePreviews, setEvidencePreviews] = useState([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [crewNote, setCrewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── NEW: RAG auto-fill state ──
  const [ragPlanLoading, setRagPlanLoading] = useState(false);

  useEffect(() => { loadIssue(); }, []);

  const loadIssue = async () => {
    const { data } = await getAssignedIssues();
    const found = data.find((i) => i._id === id);
    setIssue(found);
  };

  const openInGoogleMaps = () => {
    if (issue?.location?.lat && issue?.location?.lng) {
      const url = `https://www.google.com/maps?q=${issue.location.lat},${issue.location.lng}`;
      window.open(url, '_blank');
    }
  };

  // ── NEW: fetch RAG suggestion and pre-fill resolution plan ──
  const fetchRAGResolutionPlan = async () => {
    setRagPlanLoading(true);
    try {
      const res = await getRAGSuggestion(id);
      const responseData = res.data ?? {};
      const result = responseData.suggestion ?? responseData;
      if (result?.steps?.length > 0) {
        const autoFilled = [
          result.summary,
          "",
          "Steps:",
          ...result.steps.map((s, i) => `${i + 1}. ${s}`),
          "",
          `Estimated time: ${result.estimated_time || "TBD"}`,
          `Materials needed: ${result.materials?.join(", ") || "Standard equipment"}`,
        ].join("\n");
        setComment(autoFilled);
      }
    } catch (e) {
      console.error("RAG auto-fill failed:", e);
    } finally {
      setRagPlanLoading(false);
    }
  };

  // ── UPDATED: trigger RAG auto-fill when opening in_progress modal ──
  const handleStatusClick = (status) => {
    setSelectedStatus(status);
    setComment(""); setEvidenceFiles([]); setEvidencePreviews([]);
    setRejectionReason(""); setCrewNote(""); setError("");
    if (status === "in_progress" || status === "resolved" || status === "rejected") {
      setShowModal(true);
      if (status === "in_progress") {
        fetchRAGResolutionPlan();
      }
    } else {
      updateStatus(status);
    }
  };

  const updateStatus = async () => {
    try {
      setLoading(true); setError("");
      if (selectedStatus === "in_progress" && comment.trim().length === 0) {
        setError("Resolution Plan comment is required"); setLoading(false); return;
      }
      if (selectedStatus === "resolved" && evidenceFiles.length === 0) {
        setError("At least one proof image is required"); setLoading(false); return;
      }
      if (selectedStatus === "rejected") {
        const softReasons = ["Insufficient Resources", "Specialized Equipment Needed"];
        if (!rejectionReason) { setError("Please choose a rejection reason"); setLoading(false); return; }
        if (softReasons.includes(rejectionReason) && crewNote.trim().length === 0) {
          setError("Crew note is required for this rejection reason"); setLoading(false); return;
        }
      }
      await updateIssueStatus(id, selectedStatus, {
        comment: comment || undefined, evidenceFiles,
        rejectionReason: rejectionReason || undefined,
        crewNote: crewNote || undefined,
      });
      alert("Status updated successfully");
      setShowModal(false);
      navigate("/issues");
    } catch (err) {
      setError(err.response?.data?.message || "Error updating status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showModal) {
      setComment(""); setEvidenceFiles([]); setEvidencePreviews([]);
      setRejectionReason(""); setCrewNote(""); setError("");
    }
  }, [showModal]);

  if (!issue) return <div className="text-slate-800 p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/issues")}
          className="flex items-center gap-2 mb-6 text-slate-600 hover:text-slate-800">
          <ArrowLeft size={20} />
          <span>Back to list</span>
        </button>

        <RAGSuggestionPanel issueId={id} />

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-4 text-slate-800">{issue.title}</h1>

          {issue.images?.length > 0 && (
            <div className="mb-6 space-y-4">
              {issue.images.map((img, index) => (
                <img key={index} src={img} alt="Issue" className="w-full rounded-lg object-cover" />
              ))}
            </div>
          )}

          <p className="mb-4 text-slate-700 leading-relaxed">{issue.description}</p>

          <div className="text-sm text-slate-600 mb-2">
            <p>Category: <span className="font-medium">{issue.category}</span></p>
            <p>Location: 
              <span 
                className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer underline decoration-dotted hover:decoration-solid transition-all duration-200"
                onClick={openInGoogleMaps}
                title="Click to open in Google Maps"
              >
                {issue.location?.address || `${issue.location?.lat?.toFixed(4)}, ${issue.location?.lng?.toFixed(4)}`}
              </span>
            </p>
            {issue.urgencyLabel && <p>Urgency: <span className="font-medium">{issue.urgencyLabel}</span></p>}
          </div>

          <p className="mt-4">Status: <span className="text-blue-500 font-semibold">{issue.status}</span></p>

          <div className="mt-6 flex flex-wrap gap-4">
            <button onClick={() => handleStatusClick("in_progress")}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
              <AlertCircle size={18} /> In Progress
            </button>
            <button onClick={() => handleStatusClick("resolved")}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
              <CheckCircle size={18} /> Resolve
            </button>
            <button onClick={() => handleStatusClick("rejected")}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
              <XCircle size={18} /> Reject
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/80 backdrop-blur backdrop-saturate-150 rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-800">
                {selectedStatus === "in_progress" ? "Resolution Plan"
                  : selectedStatus === "resolved" ? "Proof of Resolution"
                  : "Reject Issue"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-700">
                <X size={24} />
              </button>
            </div>

            {/* ── IN PROGRESS: RAG auto-fill loading + textarea ── */}
            {selectedStatus === "in_progress" && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Describe your resolution plan *
                  </label>
                  {/* RAG loading indicator */}
                  {ragPlanLoading && (
                    <span className="text-xs text-violet-600 flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" />
                      AI pre-filling...
                    </span>
                  )}
                </div>
                {/* Purple border when RAG has filled content */}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={ragPlanLoading ? "AI is generating your resolution plan..." : "What steps will you take to resolve this issue?"}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors
                    ${comment && !ragPlanLoading ? "border-violet-300 ring-1 ring-violet-100 bg-violet-50/30" : "border-slate-300"}`}
                  rows="8"
                  disabled={ragPlanLoading}
                />
                {comment && !ragPlanLoading && (
                  <p className="text-xs text-violet-500 mt-1 flex items-center gap-1">
                    <Brain size={10} /> Pre-filled by AI based on similar past cases — edit as needed
                  </p>
                )}
              </div>
            )}

            {selectedStatus === "resolved" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Upload proofs of resolution * (max 3)
                </label>
                <input type="file" accept="image/*" multiple id="evidence-upload" className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files).slice(0, 3);
                    const compressedList = [], previewList = [];
                    for (const file of files) {
                      try {
                        const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
                        compressedList.push(compressed);
                        const dataUrl = await new Promise((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => resolve(reader.result);
                          reader.readAsDataURL(compressed);
                        });
                        previewList.push(dataUrl);
                      } catch (err) { console.error("compression error", err); }
                    }
                    setEvidenceFiles(compressedList);
                    setEvidencePreviews(previewList);
                  }}
                />
                <label htmlFor="evidence-upload"
                  className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                  <div className="text-center text-slate-600">
                    {evidencePreviews.length > 0 ? "Add/Change images" : "Click to select or drag images"}
                  </div>
                </label>
                {evidencePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {evidencePreviews.map((src, idx) => (
                      <div key={idx} className="relative">
                        <img src={src} alt={`proof ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        <button type="button" onClick={() => {
                          const nf = [...evidenceFiles]; const np = [...evidencePreviews];
                          nf.splice(idx, 1); np.splice(idx, 1);
                          setEvidenceFiles(nf); setEvidencePreviews(np);
                        }} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedStatus === "rejected" && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rejection Reason *</label>
                  <select value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="">Select reason</option>
                    <optgroup label="Hard Reasons">
                      <option>Duplicate Issue</option>
                      <option>Issue Spamming</option>
                    </optgroup>
                    <optgroup label="Soft Reasons">
                      <option>Insufficient Resources</option>
                      <option>Specialized Equipment Needed</option>
                    </optgroup>
                  </select>
                </div>
                {(rejectionReason === "Insufficient Resources" || rejectionReason === "Specialized Equipment Needed") && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Crew Note *</label>
                    <textarea value={crewNote} onChange={(e) => setCrewNote(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      rows="4" />
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} disabled={loading || ragPlanLoading}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition disabled:opacity-50">
                Cancel
              </button>
              <button onClick={updateStatus} disabled={loading || ragPlanLoading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50">
                {loading ? "Saving..." : ragPlanLoading ? "Loading AI..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}