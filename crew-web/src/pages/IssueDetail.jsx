import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAssignedIssues, updateIssueStatus } from "../services/api";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Trash2,
} from "lucide-react";
import imageCompression from "browser-image-compression";

export default function IssueDetail() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  // inputs for various statuses
  const [comment, setComment] = useState("");

  // evidence files for resolved
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidencePreviews, setEvidencePreviews] = useState([]);

  // rejection workflow
  const [rejectionReason, setRejectionReason] = useState("");
  const [crewNote, setCrewNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadIssue();
  }, []);

  const loadIssue = async () => {
    const { data } = await getAssignedIssues();
    const found = data.find((i) => i._id === id);
    setIssue(found);
  };

  const handleStatusClick = (status) => {
    setSelectedStatus(status);
    setComment("");
    setEvidenceFiles([]);
    setEvidencePreviews([]);
    setRejectionReason("");
    setCrewNote("");
    setError("");

    // show modal for statuses that require input
    if (status === "in_progress" || status === "resolved" || status === "rejected") {
      setShowModal(true);
    } else {
      // immediate transitions (e.g. pending->assigned) not used here
      updateStatus(status);
    }
  };

  const updateStatus = async () => {
    try {
      setLoading(true);
      setError("");

      // Input validation based on selectedStatus
      if (selectedStatus === "in_progress" && comment.trim().length === 0) {
        setError("Resolution Plan comment is required");
        setLoading(false);
        return;
      }

      if (selectedStatus === "resolved" && evidenceFiles.length === 0) {
        setError("At least one proof image is required");
        setLoading(false);
        return;
      }

      if (selectedStatus === "rejected") {
        const hardReasons = ["Duplicate Issue", "Issue Spamming"];
        const softReasons = ["Insufficient Resources", "Specialized Equipment Needed"];
        if (!rejectionReason) {
          setError("Please choose a rejection reason");
          setLoading(false);
          return;
        }
        if (softReasons.includes(rejectionReason) && crewNote.trim().length === 0) {
          setError("Crew note is required for this rejection reason");
          setLoading(false);
          return;
        }
      }

      // call API
      await updateIssueStatus(id, selectedStatus, {
        comment: comment || undefined,
        evidenceFiles,
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

  const handleModalSubmit = async () => {
    await updateStatus();
  };

  // reset temporary state when modal closes
  useEffect(() => {
    if (!showModal) {
      setComment("");
      setEvidenceFiles([]);
      setEvidencePreviews([]);
      setRejectionReason("");
      setCrewNote("");
      setError("");
    }
  }, [showModal]);

  if (!issue) {
    return <div className="text-slate-800 p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <button
          onClick={() => navigate("/issues")}
          className="flex items-center gap-2 mb-6 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft size={20} />
          <span>Back to list</span>
        </button>

        <h1 className="text-3xl font-bold mb-4 text-slate-800">
          {issue.title}
        </h1>

        {/* Show All Images */}
        {issue.images && issue.images.length > 0 && (
          <div className="mb-6 space-y-4">
            {issue.images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt="Issue"
                className="w-full rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        <p className="mb-4 text-slate-700 leading-relaxed">
          {issue.description}
        </p>

        <div className="text-sm text-slate-600 mb-2">
          <p>Category: <span className="font-medium">{issue.category}</span></p>
          <p>Location: <span className="font-medium">{issue.location?.address || `${issue.location?.lat.toFixed(4)}, ${issue.location?.lng.toFixed(4)}`}</span></p>
        </div>

        <p className="mt-4">
          Status: <span className="text-blue-500 font-semibold">{issue.status}</span>
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={() => handleStatusClick("in_progress")}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
          >
            <AlertCircle size={18} />
            In Progress
          </button>

          <button
            onClick={() => handleStatusClick("resolved")}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            <CheckCircle size={18} />
            Resolve
          </button>

          <button
            onClick={() => handleStatusClick("rejected")}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            <XCircle size={18} />
            Reject
          </button>
        </div>
      </div>

      {/* Modal for mandatory inputs */}
      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/80 backdrop-blur backdrop-saturate-150 rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-800">
                {selectedStatus === "in_progress" ? "Resolution Plan" : "Proof of Resolution"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X size={24} />
              </button>
            </div>

            {selectedStatus === "in_progress" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Describe your resolution plan *
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What steps will you take to resolve this issue?"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows="5"
                />
              </div>
            )}

            {selectedStatus === "resolved" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Upload proofs of resolution * (max 3)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files).slice(0, 3);
                      const compressedList = [];
                      const previewList = [];
                      for (const file of files) {
                        try {
                          const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
                          const compressed = await imageCompression(file, options);
                          compressedList.push(compressed);
                          const dataUrl = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(compressed);
                          });
                          previewList.push(dataUrl);
                        } catch (err) {
                          console.error("compression error", err);
                        }
                      }
                      setEvidenceFiles(compressedList);
                      setEvidencePreviews(previewList);
                    }}
                    className="hidden"
                    id="evidence-upload"
                  />
                  <label
                    htmlFor="evidence-upload"
                    className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="text-center text-slate-600">
                      {evidencePreviews.length > 0 ? (
                        "Add/Change images (drag & drop)"
                      ) : (
                        "Click to select or drag images"
                      )}
                    </div>
                  </label>
                </div>
                {evidencePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {evidencePreviews.map((src, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={src}
                          alt={`proof ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = [...evidenceFiles];
                            const newPreviews = [...evidencePreviews];
                            newFiles.splice(idx, 1);
                            newPreviews.splice(idx, 1);
                            setEvidenceFiles(newFiles);
                            setEvidencePreviews(newPreviews);
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition"
                        >
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rejection Reason *
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
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
                {rejectionReason === "Insufficient Resources" ||
                rejectionReason === "Specialized Equipment Needed" ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Crew Note *
                    </label>
                    <textarea
                      value={crewNote}
                      onChange={(e) => setCrewNote(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      rows="4"
                    />
                  </div>
                ) : null}
              </>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

