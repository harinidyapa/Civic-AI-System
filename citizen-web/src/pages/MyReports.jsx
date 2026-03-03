import { useEffect, useState } from "react";
import { getMyReports } from "../services/api";
import { FileText, MapPin, CheckCircle, Clock, AlertCircle, Images } from "lucide-react";

function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getMyReports();
      setReports(res.data);
      setError(null);
    } catch (error) {
      console.error(error);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
      case "completed":
        return <CheckCircle size={20} className="text-green-600" />;
      case "pending":
        return <Clock size={20} className="text-yellow-600" />;
      case "in progress":
        return <AlertCircle size={20} className="text-blue-600" />;
      default:
        return <FileText size={20} className="text-slate-600" />;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
            <div className="bg-emerald-600 rounded-full p-2">
              <FileText size={28} className="text-white" />
            </div>
            My Reports
          </h2>
          <p className="text-slate-600 mt-2">
            Track all your submitted issues and their status
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={fetchReports}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600 mt-4">Loading your reports...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 border border-slate-200 text-center">
            <div className="inline-block mb-4 p-3 bg-slate-100 rounded-full">
              <FileText size={28} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Reports Yet</h3>
            <p className="text-slate-600">You haven't submitted any reports yet. Start by reporting an issue!</p>
          </div>
        )}

        {/* Reports Grid */}
        {!loading && reports.length > 0 && (
          <div className="grid gap-6">
            {reports.map((report) => (
              <div
                key={report._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-600 text-sm mb-3">
                        <MapPin size={16} />
                        <span>
                          {report.location?.address || `${report.location?.lat?.toFixed(4)}, ${report.location?.lng?.toFixed(4)}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(report.status)}
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                          report.status
                        )}`}
                      >
                        {report.status || "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                      {report.category}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-slate-700 mb-4 leading-relaxed">
                    {report.description}
                  </p>

                  {/* Images Grid */}
                  {report.images?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Images size={18} className="text-slate-600" />
                        <span className="text-sm font-medium text-slate-600">
                          {report.images.length} image{report.images.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {report.images.map((image, idx) => (
                          <div key={idx} className="relative group overflow-hidden rounded-lg">
                            <img
                              src={image}
                              alt={`Issue ${idx + 1}`}
                              className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-col sm:flex-row gap-4 text-xs text-slate-600 border-t border-slate-200 pt-4">
                    <div>
                      <span className="font-medium">Submitted:</span> {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                    {report.updatedAt && (
                      <div>
                        <span className="font-medium">Last Updated:</span> {new Date(report.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyReports;