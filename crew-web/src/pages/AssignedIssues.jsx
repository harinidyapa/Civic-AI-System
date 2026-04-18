import { useCallback, useEffect, useState } from "react";
import { getAssignedIssues } from "../services/api";
import { useNavigate } from "react-router-dom";
import { FileText, MapPin, ArrowLeft, RefreshCw, Clock, AlertTriangle, CheckCircle, XCircle, Navigation } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mini Map Component
function MiniMap({ lat, lng, address, zoom = 15, onClick }) {
  if (!lat || !lng) {
    return (
      <div className="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-slate-500">
          <MapPin size={24} className="mx-auto mb-1" />
          <p className="text-xs">Location not available</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-32 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick && onClick(lat, lng)}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="text-sm">
              <strong>Location:</strong><br />
              {address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default function AssignedIssues() {
  const [issues, setIssues] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchIssues = useCallback(async () => {
    try {
      setRefreshing(true);
      const { data } = await getAssignedIssues();
      setIssues(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    const onRefresh = () => fetchIssues();
    window.addEventListener("app-refresh", onRefresh);
    return () => window.removeEventListener("app-refresh", onRefresh);
  }, [fetchIssues]);

  const openInGoogleMaps = (lat, lng) => {
    if (lat && lng) {
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  const statusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          text: "text-yellow-700",
          icon: <Clock size={14} />,
          label: "Pending"
        };
      case "in_progress":
      case "in progress":
        return {
          bg: "bg-orange-50 border-orange-200",
          text: "text-orange-700",
          icon: <AlertTriangle size={14} />,
          label: "In Progress"
        };
      case "assigned":
        return {
          bg: "bg-blue-50 border-blue-200",
          text: "text-blue-700",
          icon: <Navigation size={14} />,
          label: "Assigned"
        };
      case "resolved":
        return {
          bg: "bg-green-50 border-green-200",
          text: "text-green-700",
          icon: <CheckCircle size={14} />,
          label: "Resolved"
        };
      case "rejected":
        return {
          bg: "bg-red-50 border-red-200",
          text: "text-red-700",
          icon: <XCircle size={14} />,
          label: "Rejected"
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-200",
          text: "text-slate-700",
          icon: <Clock size={14} />,
          label: "Unknown"
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Dashboard</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl">
                    <FileText size={28} className="text-emerald-600" />
                  </div>
                  My Assigned Issues
                </h1>
                <p className="text-slate-600 mt-1">Manage and resolve your assigned maintenance tasks</p>
              </div>
            </div>
            <button
              onClick={fetchIssues}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Issues Grid */}
        {issues.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Issues Assigned</h3>
              <p className="text-slate-600">You don't have any assigned issues at the moment. Check back later or contact your supervisor.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {issues.map((issue) => {
              const statusInfo = statusBadge(issue.status);
              return (
                <div
                  key={issue._id}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/issues/${issue._id}`)}
                >
                  {/* Issue Image */}
                  {issue.images && issue.images.length > 0 && (
                    <div className="relative overflow-hidden">
                      <img
                        src={issue.images[0]}
                        alt="Issue"
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.text} shadow-sm`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Title and Category */}
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                        {issue.title}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {issue.category}
                        </span>
                        {issue.urgencyLabel && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle size={10} />
                            {issue.urgencyLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Location Map */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={16} className="text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Location</span>
                      </div>
                      <MiniMap
                        lat={issue.location?.lat}
                        lng={issue.location?.lng}
                        address={issue.location?.address}
                        onClick={openInGoogleMaps}
                      />
                      {issue.location?.address && (
                        <p className="text-xs text-slate-600 mt-2 flex items-start gap-1">
                          <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                          {issue.location.address}
                        </p>
                      )}
                    </div>

                    {/* Issue Details */}
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Reported by:</span>
                        <span>{issue.reportedBy?.name || "Unknown"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Date:</span>
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                      {issue.aiSeverityScore && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Severity:</span>
                          <span className={`font-semibold ${
                            issue.aiSeverityScore >= 4 ? 'text-red-600' :
                            issue.aiSeverityScore >= 3 ? 'text-orange-600' :
                            issue.aiSeverityScore >= 2 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {issue.aiSeverityScore}/5
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <button
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/issues/${issue._id}`);
                        }}
                      >
                        View Details & Take Action
                      </button>
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