import { useEffect, useState } from "react";
import { getMyReports, getIssueDetail, markLogsAsViewed } from "../services/api";
import { Calendar, MapPin, CheckCircle, AlertCircle, Clock, Image as ImageIcon } from "lucide-react";

export default function Logs() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [selectedIssueData, setSelectedIssueData] = useState(null);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      const { data } = await getMyReports();
      setIssues(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading issues:", error);
      setLoading(false);
    }
  };

  const handleIssueClick = async (issueId) => {
    try {
      setSelectedIssueId(issueId);
      const { data } = await getIssueDetail(issueId);
      setSelectedIssueData(data);
      
      // Mark logs as viewed
      await markLogsAsViewed(issueId);
    } catch (error) {
      console.error("Error loading issue detail:", error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-slate-100 text-slate-700",
      assigned: "bg-blue-100 text-blue-700",
      in_progress: "bg-yellow-100 text-yellow-700",
      resolved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "in_progress":
        return <AlertCircle size={18} />;
      case "resolved":
        return <CheckCircle size={18} />;
      default:
        return <Clock size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="text-slate-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (selectedIssueData) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              setSelectedIssueId(null);
              setSelectedIssueData(null);
            }}
            className="mb-6 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Issues
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {selectedIssueData.title}
            </h1>

            <div className="flex gap-4 mb-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                {selectedIssueData.location?.address || `${selectedIssueData.location?.lat}, ${selectedIssueData.location?.lng}`}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {new Date(selectedIssueData.createdAt).toLocaleDateString()}
              </div>
            </div>

            <p className="text-slate-700 mb-6 leading-relaxed">
              {selectedIssueData.description}
            </p>

            {selectedIssueData.images && selectedIssueData.images.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-slate-800 mb-3">Reported Images:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedIssueData.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="Issue"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="mt-8 border-t pt-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Timeline</h2>

              {selectedIssueData.createdAt && (
                <div className="mb-6 pb-6 border-b">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center">
                        <Clock size={20} className="text-slate-600" />
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-1 bg-slate-200 text-slate-700`}>
                        Created
                      </div>
                      <p className="text-slate-600 text-sm">
                        {new Date(selectedIssueData.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedIssueData.activityLog && selectedIssueData.activityLog.length > 0 ? (
                selectedIssueData.activityLog.map((log, idx) => (
                  <div key={idx} className="mb-6 pb-6 border-b last:border-b-0">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                          log.status === 'resolved' ? 'bg-green-500' :
                          log.status === 'in_progress' ? 'bg-yellow-500' :
                          log.status === 'rejected' ? 'bg-red-500' :
                          log.status === 'assigned' ? 'bg-blue-500' :
                          'bg-slate-500'
                        }`}>
                          {getStatusIcon(log.status)}
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${getStatusColor(log.status)}`}>
                          {log.status.replace('_', ' ').charAt(0).toUpperCase() + log.status.slice(1).replace('_', ' ')}
                        </div>
                        <p className="text-slate-600 text-sm mb-3">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>

                        {/* Show crew member info */}
                        {log.changedBy && (
                          <p className="text-slate-600 text-sm mb-3">
                            Updated by: <span className="font-medium">{log.changedBy.name}</span>
                          </p>
                        )}

                        {/* Show comment for in_progress */}
                        {log.comment && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                            <p className="font-semibold text-blue-900 mb-2">Resolution Plan:</p>
                            <p className="text-blue-800">{log.comment}</p>
                          </div>
                        )}

                        {/* Show proof images for resolved */}
                        {log.evidenceImages && log.evidenceImages.length > 0 && (
                          <div className="mb-3">
                            <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                              <ImageIcon size={16} />
                              Proof of Resolution ({log.evidenceImages.length})
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {log.evidenceImages.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Proof ${idx + 1}`}
                                  className="max-w-xs h-auto rounded-lg border border-slate-200"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Show rejection reason/note if present */}
                        {log.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                            <p className="font-semibold text-red-900 mb-2">Rejection Reason:</p>
                            <p className="text-red-800">{log.rejectionReason}</p>
                          </div>
                        )}
                        {log.crewNote && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                            <p className="font-semibold text-yellow-900 mb-2">Crew Note:</p>
                            <p className="text-yellow-800">{log.crewNote}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No activity updates yet
                </div>
              )}
            </div>

            {/* Current Status Panel */}
            <div className="mt-8 bg-slate-50 rounded-lg p-6">
              <h3 className="font-semibold text-slate-800 mb-3">Current Status</h3>
              <div className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${getStatusColor(selectedIssueData.status)}`}>
                {selectedIssueData.status.replace('_', ' ').charAt(0).toUpperCase() + selectedIssueData.status.slice(1).replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-800 mb-8">Issue Logs</h1>

        {issues.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-slate-600 text-lg">No issues reported yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => {
              const totalLogs = (issue.activityLog?.length || 0) + 1; // +1 for creation event
              const unviewedLogs = issue.activityLog?.filter(log => !log.isViewed).length || 0;

              return (
                <div
                  key={issue._id}
                  onClick={() => handleIssueClick(issue._id)}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{issue.title}</h2>
                      <p className="text-slate-600 text-sm mt-1">{issue.description.substring(0, 100)}...</p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </div>
                      {unviewedLogs > 0 && (
                        <div className="mt-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {unviewedLogs}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {totalLogs} event{totalLogs !== 1 ? 's' : ''}
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
