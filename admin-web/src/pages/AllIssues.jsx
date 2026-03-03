import { useEffect, useState } from "react";
import { getAllIssues, assignIssue, getCrews } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function AllIssues() {
  const [issues, setIssues] = useState([]);
  const [crews, setCrews] = useState([]);
  const [assignModalIssue, setAssignModalIssue] = useState(null);
  const [chosenCrewId, setChosenCrewId] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending"); // pending/assigned/in_progress/resolved/rejected

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allRes = await getAllIssues(token, false);
        setIssues(allRes.data);
        const crewsRes = await getCrews(token);
        setCrews(crewsRes.data);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch data");
      }
    };
    fetchData();
  }, [token]);

  const handleAssign = async (issueId, crewId) => {
    try {
      await assignIssue(issueId, crewId, token);
      alert("Assigned successfully!");
      // update local state so button text changes immediately
      setIssues((prev) =>
        prev.map((iss) =>
          iss._id === issueId ? { ...iss, status: "assigned", assignedTo: crewId } : iss
        )
      );
      setAssignModalIssue(null);
      setChosenCrewId("");
    } catch (err) {
      console.error(err);
      alert("Failed to assign issue");
    }
  };

  // navigation to detail page
  const openDetail = (issue) => {
    navigate(`/issues/${issue._id}`);
  };

  const statusClasses = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "assigned":
        return "text-blue-600 bg-blue-100";
      case "in progress":
      case "in_progress":
        return "text-orange-600 bg-orange-100";
      case "resolved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  const normalizeStatus = (s) => {
    if (!s) return "";
    return String(s).toLowerCase().replace(/\s+/g, "_");
  };

  const openAssignModal = (issue) => {
    setAssignModalIssue(issue);
    setChosenCrewId("");
  };

  const closeAssignModal = () => {
    setAssignModalIssue(null);
    setChosenCrewId("");
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Issue Management</h1>

      {/* Tab Navigation: horizontal tabs on md+; dropdown on small screens */}
      <div className="mb-6">
        <div className="hidden md:flex gap-4 border-b">
          {[
            { key: 'pending', label: 'Pending' },
            { key: 'assigned', label: 'Assigned' },
            { key: 'in_progress', label: 'In-Progress' },
            { key: 'resolved', label: 'Resolved' },
            { key: 'rejected', label: 'Rejected' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.label} ({issues.filter(i => normalizeStatus(i.status) === tab.key).length})
            </button>
          ))}
        </div>

        <div className="md:hidden">
          <label className="sr-only">Filter issues by status</label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-300 bg-white mb-2"
          >
            <option value="pending">Pending ({issues.filter(i => normalizeStatus(i.status) === 'pending').length})</option>
            <option value="assigned">Assigned ({issues.filter(i => normalizeStatus(i.status) === 'assigned').length})</option>
            <option value="in_progress">In-Progress ({issues.filter(i => normalizeStatus(i.status) === 'in_progress').length})</option>
            <option value="resolved">Resolved ({issues.filter(i => normalizeStatus(i.status) === 'resolved').length})</option>
            <option value="rejected">Rejected ({issues.filter(i => normalizeStatus(i.status) === 'rejected').length})</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {issues.filter(i => i.status === activeTab).length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            No issues in this category
          </div>
        ) : (
          issues
            .filter(i => i.status === activeTab)
            .map((issue) => (
              <div
                key={issue._id}
                onClick={() => openDetail(issue)}
                className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold text-slate-800 truncate">
                    {issue.title}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses(issue.status)}`}
                  >
                    {issue.status}
                  </span>
                </div>
                <p className="text-slate-600 text-sm mb-2 truncate">
                  Category: {issue.category}
                </p>
                <p className="text-slate-600 text-sm mb-2 truncate">
                  Reported by: {issue.reportedBy?.name}
                </p>
                <p className="text-slate-600 text-sm mb-4 truncate">
                  Assigned to: {issue.assignedTo?.name || "—"}
                </p>
                {issue.activityLog &&
                  (() => {
                    const last = issue.activityLog[issue.activityLog.length-1];
                    if (!last) return null;
                    return (
                      <>
                        {last.crewNote && (
                          <p className="text-xs text-red-600">Crew note: {last.crewNote}</p>
                        )}
                        {last.rejectionReason && (
                          <p className="text-xs text-red-600">Rejection: {last.rejectionReason}</p>
                        )}
                      </>
                    );
                  })()
                }
                <div className="flex justify-between items-center">
                  {issue.status === "assigned" ? (
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded opacity-70 cursor-not-allowed"
                      disabled
                    >
                      Assigned
                    </button>
                  ) : activeTab === 'pending' ? (
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAssignModal(issue);
                      }}
                    >
                      Assign
                    </button>
                  ) : null}
                  <span className="text-xs text-slate-400">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
        )}
      </div>

      {assignModalIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={closeAssignModal}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Assign Crew</h2>
            <p className="mb-2">Issue: <strong>{assignModalIssue.title}</strong></p>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {crews.map((crew) => (
                <div key={crew._id} className="flex items-center">
                  <input
                    type="radio"
                    name="crew"
                    value={crew._id}
                    checked={chosenCrewId === crew._id}
                    onChange={() => setChosenCrewId(crew._id)}
                    className="mr-2"
                  />
                  <span>{crew.name}</span>
                </div>
              ))}
            </div>
            <button
              disabled={!chosenCrewId}
              className={`w-full py-2 rounded text-white ${
                chosenCrewId ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 cursor-not-allowed"
              }`}
              onClick={() => handleAssign(assignModalIssue._id, chosenCrewId)}
            >
              Confirm Assign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}