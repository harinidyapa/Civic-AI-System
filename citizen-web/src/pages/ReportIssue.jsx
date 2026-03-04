import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import {
  Upload, MapPin, AlertCircle, Trash2, Search, X, Camera,
  Loader2, Sparkles, CheckCircle2, AlertTriangle, Bot
} from "lucide-react";
import imageCompression from "browser-image-compression";

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const AI_SERVICE_URL = "http://localhost:8000";

const URGENCY_COLORS = {
  Critical: "bg-red-100 text-red-700 border-red-300",
  High:     "bg-orange-100 text-orange-700 border-orange-300",
  Medium:   "bg-yellow-100 text-yellow-700 border-yellow-300",
  Low:      "bg-blue-100 text-blue-700 border-blue-300",
  "Very Low":"bg-slate-100 text-slate-600 border-slate-300",
};

// ── Map helpers ──────────────────────────────

function ChangeView({ center }) {
  const map = useMap();
  if (center) map.setView(center, 16);
  return null;
}

function LocationMarker({ position, setPosition, setAddress, setSearchQuery }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      reverseGeocode(lat, lng, (addr) => {
        setAddress(addr);
        setSearchQuery(addr);
      });
    },
  });
  return position ? <Marker position={position} /> : null;
}

async function reverseGeocode(lat, lng, callback) {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
    const data = await res.json();
    if (data.features?.length > 0) {
      const props = data.features[0].properties;
      callback(props.name || props.street || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  } catch (err) {
    console.error("Reverse geocoding error:", err);
  }
}

async function searchAddress(query) {
  if (query.length < 3) return [];
  try {
    const res = await fetch(`https://photon.komoot.io/api?q=${encodeURIComponent(query)}&limit=5`);
    const data = await res.json();
    return data.features || [];
  } catch (err) {
    return [];
  }
}

// ── AI Suggestion Badge ──────────────────────

function AISuggestedBadge({ confidence }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 font-medium">
      <Bot size={11} />
      AI Suggested · {confidence}% confident
    </span>
  );
}

// ── AI Analysis Panel ────────────────────────

function AIAnalysisPanel({ aiResult, onDismiss }) {
  if (!aiResult) return null;

  const urgencyColor = URGENCY_COLORS[aiResult.urgency?.label] || URGENCY_COLORS["Low"];
  const isMiscategorized = aiResult.is_miscategorized;

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-2 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        type="button"
      >
        <X size={14} />
      </button>

      <div className="flex items-center gap-2 text-violet-800 font-semibold text-sm">
        <Sparkles size={15} className="text-violet-500" />
        AI Analysis Complete
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Detected Category</p>
          <p className="font-semibold text-slate-800">{aiResult.predicted_category}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Severity Score</p>
          <p className="font-semibold text-slate-800">{aiResult.severity_score ?? "—"}</p>
        </div>
      </div>

      {aiResult.urgency?.label && (
        <div className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2 py-0.5 ${urgencyColor}`}>
          <AlertTriangle size={11} />
          {aiResult.urgency.label} Urgency
          {aiResult.urgency?.keywords?.length > 0 && (
            <span className="opacity-70">· {aiResult.urgency.keywords.slice(0, 2).join(", ")}</span>
          )}
        </div>
      )}

      {isMiscategorized && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle size={12} />
          Low confidence — please verify the category
        </p>
      )}

      {!isMiscategorized && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <CheckCircle2 size={12} />
          Category & description auto-filled below — feel free to edit
        </p>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────

function ReportIssue() {
  const [formData, setFormData] = useState({ title: "", description: "", category: "" });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [geoLoading, setGeoLoading] = useState(true);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiApplied, setAiApplied] = useState({ category: false, description: false });

  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Auto-detect location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          reverseGeocode(latitude, longitude, (addr) => {
            setAddress(addr);
            setSearchQuery(addr);
          });
          setGeoLoading(false);
        },
        () => setGeoLoading(false)
      );
    } else {
      setGeoLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // If user manually edits an AI-suggested field, clear the badge for that field
    if (name === "category") setAiApplied(prev => ({ ...prev, category: false }));
    if (name === "description") setAiApplied(prev => ({ ...prev, description: false }));
  };

  // ── AI analysis triggered after image compression ──
  const runAIAnalysis = async (compressedFile, currentDescription) => {
    setAiLoading(true);
    setAiResult(null);

    try {
      // Convert compressed file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
      });

      const response = await axios.post(`${AI_SERVICE_URL}/analyze-and-enhance`, {
        image: base64,
        description: currentDescription || ""
      });

      const result = response.data;
      setAiResult(result);

      // Auto-fill category if not already set by user
      if (result.predicted_category && result.predicted_category !== "Uncategorized") {
        setFormData(prev => ({
          ...prev,
          category: prev.category || result.predicted_category,
          description: prev.description || result.enhanced_description || ""
        }));
        setAiApplied({
          category: !formData.category,
          description: !formData.description
        });
      }

    } catch (err) {
      console.error("AI analysis failed:", err.message);
      // Silently fail - don't block the user
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (images.length + files.length > 3) {
      alert("You can only upload a maximum of 3 images.");
      return;
    }

    setIsCompressing(true);
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    let firstNewFile = null;

    for (const file of files) {
      try {
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);

        if (!firstNewFile) firstNewFile = compressedFile; // track first for AI

        newImages.push(compressedFile);
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        await new Promise((resolve) => {
          reader.onloadend = () => {
            newPreviews.push(reader.result);
            resolve();
          };
        });
      } catch (error) {
        console.error("Compression Error:", error);
      }
    }

    setImages(newImages);
    setImagePreviews(newPreviews);
    setIsCompressing(false);
    e.target.value = "";

    // ── Trigger AI analysis on the first uploaded image ──
    // Only runs once (when first image is added)
    if (firstNewFile && images.length === 0) {
      runAIAnalysis(firstNewFile, formData.description);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    // If all images removed, clear AI result
    if (images.length === 1) {
      setAiResult(null);
      setAiApplied({ category: false, description: false });
    }
  };

  const handleSearch = (val) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.length < 3) { setSuggestions([]); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchAddress(val);
      setSuggestions(results);
      setShowSuggestions(true);
    }, 400);
  };

  const selectSuggestion = (feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const addr = feature.properties.name || feature.properties.street;
    setPosition([lat, lon]);
    setAddress(addr);
    setSearchQuery(addr);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position || !address) return alert("Please select a location.");
    if (images.length === 0) return alert("Please upload at least one image.");

    setLoading(true);
    const finalData = new FormData();
    finalData.append("title", formData.title);
    finalData.append("description", formData.description);
    finalData.append("category", formData.category);
    finalData.append("lat", position[0]);
    finalData.append("lng", position[1]);
    finalData.append("address", address);
    images.forEach((img) => finalData.append("images", img));

    try {
      await axios.post("http://localhost:5000/api/issues", finalData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      alert("Issue Reported Successfully!");
      navigate("/my-reports");
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="bg-red-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold flex justify-center items-center gap-2">
            <AlertCircle /> Report Civil Issue
          </h1>
          <p className="text-red-100 text-sm mt-1">Upload an image — our AI will detect the issue automatically</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left column: fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Issue Title</label>
                <input
                  name="title"
                  required
                  onChange={handleInputChange}
                  placeholder="Brief title"
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-slate-700">Category</label>
                  {aiApplied.category && aiResult && (
                    <AISuggestedBadge confidence={aiResult.confidence_percent} />
                  )}
                </div>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-red-500
                    ${aiApplied.category ? "border-violet-300 ring-1 ring-violet-200" : "border-slate-300"}`}
                >
                  <option value="">Select Category</option>
                  <option value="Pothole">Pothole</option>
                  <option value="Garbage">Garbage</option>
                  <option value="Streetlight">Streetlight</option>
                  <option value="Water Leakage">Water Leakage</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-slate-700">Description</label>
                  {aiApplied.description && (
                    <span className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 font-medium">
                      <Bot size={11} /> AI Enhanced
                    </span>
                  )}
                </div>
                <textarea
                  name="description"
                  rows="5"
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us more about the problem..."
                  className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-red-500
                    ${aiApplied.description ? "border-violet-300 ring-1 ring-violet-200" : "border-slate-300"}`}
                />
              </div>
            </div>

            {/* Right column: image upload + AI panel */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Evidence (Max 3)</label>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                  <Camera className="text-slate-400" />
                  <span className="text-xs mt-1 text-slate-500">Camera</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                </label>
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                  <Upload className="text-slate-400" />
                  <span className="text-xs mt-1 text-slate-500">Gallery</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                </label>
              </div>

              {/* Status indicators */}
              {isCompressing && (
                <p className="text-xs text-blue-600 animate-pulse flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Compressing images...
                </p>
              )}
              {aiLoading && !isCompressing && (
                <p className="text-xs text-violet-600 animate-pulse flex items-center gap-1">
                  <Sparkles size={12} className="animate-spin" /> AI is analyzing your image...
                </p>
              )}

              {/* Image previews */}
              <div className="flex gap-2 flex-wrap">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={src} className="w-full h-full object-cover rounded-lg border" alt="preview" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                    >
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-center text-white text-[9px] bg-black/50 rounded-b-lg py-0.5">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* AI Analysis result panel */}
              {aiResult && (
                <AIAnalysisPanel
                  aiResult={aiResult}
                  onDismiss={() => setAiResult(null)}
                />
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700">Search Location</label>
            <div className="relative">
              <div className="flex items-center border border-slate-300 rounded-xl p-3 bg-white focus-within:ring-2 focus-within:ring-red-500">
                <Search className="text-slate-400 mr-2" size={18} />
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Type address..."
                  className="w-full outline-none text-sm"
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-white border rounded-xl mt-1 shadow-2xl max-h-48 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => selectSuggestion(s)}
                      className="p-3 hover:bg-slate-100 cursor-pointer text-sm border-b last:border-0"
                    >
                      <p className="font-semibold">{s.properties.name}</p>
                      <p className="text-xs text-slate-500">{s.properties.city}, {s.properties.state}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-64 rounded-2xl overflow-hidden border border-slate-300 z-0 relative">
              <MapContainer center={[20.5, 78.9]} zoom={5} style={{ height: "100%" }}>
                <ChangeView center={position} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker
                  position={position}
                  setPosition={setPosition}
                  setAddress={setAddress}
                  setSearchQuery={setSearchQuery}
                />
              </MapContainer>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isCompressing || aiLoading}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg flex justify-center items-center gap-2 disabled:bg-slate-400"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Submit Final Report"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReportIssue;