import { useState, useRef, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import {
  Upload, MapPin, AlertCircle, Trash2, Search, X, Camera,
  Loader2, Sparkles, CheckCircle2, AlertTriangle, Bot, Lightbulb
} from "lucide-react";
import imageCompression from "browser-image-compression";

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

const CATEGORIES = ["Pothole", "Garbage", "Streetlight", "Water Leakage", "Other"];

// ── Severity Bar ──────────────────────────────────
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
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Severity</span>
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

// ── Map helpers ───────────────────────────────────
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
      reverseGeocode(lat, lng, (addr) => { setAddress(addr); setSearchQuery(addr); });
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
  } catch (err) { console.error("Reverse geocoding error:", err); }
}

async function searchAddress(query) {
  if (query.length < 3) return [];
  try {
    const res = await fetch(`https://photon.komoot.io/api?q=${encodeURIComponent(query)}&limit=5`);
    const data = await res.json();
    return data.features || [];
  } catch (err) { return []; }
}

// ── AI Badge ──────────────────────────────────────
function AISuggestedBadge({ confidence }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 font-medium">
      <Bot size={11} /> AI · {confidence}% confident
    </span>
  );
}

// ── RAG Description Suggestion ────────────────────
function RAGDescriptionSuggestion({ suggestion, onApply, onDismiss }) {
  if (!suggestion) return null;
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
          <Lightbulb size={13} className="text-emerald-500" />
          AI Suggestion — tap to improve your description
        </div>
        <button onClick={onDismiss} type="button" className="text-slate-400 hover:text-slate-600">
          <X size={13} />
        </button>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed bg-white rounded-lg p-2 border border-emerald-100">
        {suggestion}
      </p>
      <button
        type="button"
        onClick={onApply}
        className="w-full text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg py-1.5 transition"
      >
        ✓ Use this description
      </button>
    </div>
  );
}

// ── AI Analysis Panel ─────────────────────────────
function AIAnalysisPanel({ aiResult, onDismiss }) {
  if (!aiResult) return null;
  const urgencyColor = URGENCY_COLORS[aiResult.urgency?.label] || URGENCY_COLORS["Low"];
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3 relative">
      <button onClick={onDismiss} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600" type="button">
        <X size={14} />
      </button>
      <div className="flex items-center gap-2 text-violet-800 font-semibold text-sm">
        <Sparkles size={15} className="text-violet-500" /> AI Analysis Complete
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Detected Category</p>
          <p className="font-semibold text-slate-800">{aiResult.predicted_category}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Confidence</p>
          <p className="font-semibold text-slate-800">{aiResult.confidence_percent}%</p>
        </div>
      </div>
      {aiResult.severity_score && <SeverityBar score={aiResult.severity_score} />}
      {aiResult.urgency?.label && (
        <div className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2 py-0.5 ${urgencyColor}`}>
          <AlertTriangle size={11} />
          {aiResult.urgency.label} Urgency
          {aiResult.urgency?.keywords?.length > 0 && (
            <span className="opacity-70">· {aiResult.urgency.keywords.slice(0, 2).join(", ")}</span>
          )}
        </div>
      )}
      {aiResult.is_miscategorized
        ? <p className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle size={12} /> Low confidence — please verify the category</p>
        : <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> Category & description auto-filled — feel free to edit</p>
      }
    </div>
  );
}

// ── Main Component ────────────────────────────────
function ReportIssue() {
  const [formData, setFormData] = useState({ title: "", description: "", category: "", customCategory: "" });
  const [images, setImages]               = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [position, setPosition]           = useState(null);
  const [address, setAddress]             = useState("");
  const [searchQuery, setSearchQuery]     = useState("");
  const [suggestions, setSuggestions]     = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [geoLoading, setGeoLoading]       = useState(true);

  // AI state
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiResult, setAiResult]     = useState(null);
  const [aiApplied, setAiApplied]   = useState({ category: false, description: false });

  // RAG state — FIX: separate loading from suggestion so they don't interfere
  const [ragLoading, setRagLoading]       = useState(false);
  const [ragSuggestion, setRagSuggestion] = useState(null);

  // FIX: dedicated debounce ref for RAG (separate from address search ref)
  const ragDebounceRef  = useRef(null);
  const searchTimeoutRef = useRef(null);
  // FIX: track latest request to ignore stale responses
  const ragRequestId    = useRef(0);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          reverseGeocode(latitude, longitude, (addr) => { setAddress(addr); setSearchQuery(addr); });
          setGeoLoading(false);
        },
        () => setGeoLoading(false)
      );
    } else { setGeoLoading(false); }
  }, []);

  // ── FIX: proper debounced RAG trigger ────────────
  const scheduleRAG = useCallback((description, category) => {
    // Clear any pending RAG call
    if (ragDebounceRef.current) clearTimeout(ragDebounceRef.current);

    // Don't trigger if too short or if RAG suggestion already showing
    if (!description || description.length < 30) {
      setRagSuggestion(null);
      return;
    }

    // Wait 1.5s after user stops typing before calling RAG
    ragDebounceRef.current = setTimeout(async () => {
      const thisRequest = ++ragRequestId.current;
      setRagLoading(true);
      try {
        const res = await axios.post(`${AI_SERVICE_URL}/rag-describe`, {
          description,
          category: category || "General"
        });

        // FIX: ignore stale responses from earlier keystrokes
        if (thisRequest !== ragRequestId.current) return;

        const sugg = res.data?.suggestion;
        if (sugg && sugg.trim().length > 10) {
          setRagSuggestion(sugg);
        }
      } catch (err) {
        // silent fail — never block the user
      } finally {
        if (thisRequest === ragRequestId.current) setRagLoading(false);
      }
    }, 1500); // 1.5s debounce — long enough to avoid mid-sentence triggers
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "category") {
      setAiApplied(prev => ({ ...prev, category: false }));
    }

    if (name === "description") {
      setAiApplied(prev => ({ ...prev, description: false }));
      // Dismiss existing suggestion when user edits again
      setRagSuggestion(null);
      // Schedule a new RAG call after they stop typing
      scheduleRAG(value, formData.category);
    }
  };

  // ── Image AI analysis ─────────────────────────────
  const runAIAnalysis = async (compressedFile, currentDescription) => {
  setAiLoading(true);
  setAiResult(null);
  try {
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

    // FIX: Check if we actually got a description back
    const newDescription = result.enhanced_description || result.description;

    if (result.predicted_category && result.predicted_category !== "Uncategorized") {
      setFormData(prev => ({
        ...prev,
        // Fill category if empty
        category: prev.category || result.predicted_category,
        // FIX: Always use the enhanced version if it exists, 
        // otherwise fall back to what the user already typed
        description: newDescription ? newDescription : prev.description
      }));
      
      // Mark as applied so the violet border shows up
      setAiApplied({ 
        category: !!result.predicted_category, 
        description: !!newDescription 
      });
    }
  } catch (err) {
    console.error("AI analysis failed:", err.message);
  } finally {
    setAiLoading(false);
  }
};

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (images.length + files.length > 3) { alert("Maximum 3 images allowed."); return; }
    setIsCompressing(true);
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    let firstNewFile = null;
    for (const file of files) {
      try {
        const compressed = await imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true });
        if (!firstNewFile) firstNewFile = compressed;
        newImages.push(compressed);
        const reader = new FileReader();
        reader.readAsDataURL(compressed);
        await new Promise((resolve) => { reader.onloadend = () => { newPreviews.push(reader.result); resolve(); }; });
      } catch (error) { console.error("Compression Error:", error); }
    }
    setImages(newImages);
    setImagePreviews(newPreviews);
    setIsCompressing(false);
    e.target.value = "";
    if (firstNewFile && images.length === 0) runAIAnalysis(firstNewFile, formData.description);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    if (images.length === 1) { setAiResult(null); setAiApplied({ category: false, description: false }); }
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
    if (formData.category === "Other" && !formData.customCategory.trim()) {
      return alert("Please describe your custom category.");
    }
    setLoading(true);
    const finalData = new FormData();
    finalData.append("title", formData.title);
    finalData.append("description", formData.description);
    finalData.append("category", formData.category === "Other" ? "Other" : formData.category);
    if (formData.customCategory) finalData.append("customCategory", formData.customCategory);
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

            {/* Left column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Issue Title</label>
                <input name="title" required onChange={handleInputChange}
                  placeholder="Brief title"
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none" />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-slate-700">Category</label>
                  {aiApplied.category && aiResult && <AISuggestedBadge confidence={aiResult.confidence_percent} />}
                </div>
                <select name="category" required value={formData.category} onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-red-500
                    ${aiApplied.category ? "border-violet-300 ring-1 ring-violet-200" : "border-slate-300"}`}>
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {formData.category === "Other" && (
                  <div className="mt-2">
                    <input name="customCategory" value={formData.customCategory} onChange={handleInputChange}
                      placeholder="Describe the issue type (e.g. Broken Footpath)"
                      className="w-full p-3 rounded-xl border border-amber-300 bg-amber-50 focus:ring-2 focus:ring-amber-400 outline-none text-sm" />
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle size={11} /> This will be reviewed and categorized by admin
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-slate-700">Description</label>
                  <div className="flex items-center gap-2">
                    {/* FIX: show loading indicator properly */}
                    {ragLoading && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> AI improving...
                      </span>
                    )}
                    {aiApplied.description && !ragLoading && (
                      <span className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 font-medium">
                        <Bot size={11} /> AI Enhanced
                      </span>
                    )}
                  </div>
                </div>
                <textarea
  name="description"
  rows="5"
  required
  // This MUST be exactly this to reflect the state change
  value={formData.description || ""} 
  onChange={handleInputChange}
  placeholder="AI will suggest an improvement..."
  className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-red-500 transition-colors
    ${aiApplied.description ? "border-violet-400 ring-2 ring-violet-100" : "border-slate-300"}`}
/>
                {/* Character hint */}
                {formData.description.length > 0 && formData.description.length < 30 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Type {30 - formData.description.length} more characters for AI suggestion...
                  </p>
                )}

                {/* RAG Suggestion — FIX: rendered outside textarea so it's always visible */}
                {ragSuggestion && !ragLoading && (
                  <div className="mt-2">
                    <RAGDescriptionSuggestion
                      suggestion={ragSuggestion}
                      onApply={() => {
                        setFormData(prev => ({ ...prev, description: ragSuggestion }));
                        setRagSuggestion(null);
                        // Cancel pending RAG calls after applying
                        if (ragDebounceRef.current) clearTimeout(ragDebounceRef.current);
                      }}
                      onDismiss={() => {
                        setRagSuggestion(null);
                        if (ragDebounceRef.current) clearTimeout(ragDebounceRef.current);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
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

              <div className="flex gap-2 flex-wrap">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={src} className="w-full h-full object-cover rounded-lg border" alt="preview" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1">
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-center text-white text-[9px] bg-black/50 rounded-b-lg py-0.5">Main</span>
                    )}
                  </div>
                ))}
              </div>

              {aiResult && <AIAnalysisPanel aiResult={aiResult} onDismiss={() => setAiResult(null)} />}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700">Search Location</label>
            <div className="relative">
              <div className="flex items-center border border-slate-300 rounded-xl p-3 bg-white focus-within:ring-2 focus-within:ring-red-500">
                <Search className="text-slate-400 mr-2" size={18} />
                <input value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Type address..." className="w-full outline-none text-sm" />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-white border rounded-xl mt-1 shadow-2xl max-h-48 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <div key={i} onClick={() => selectSuggestion(s)}
                      className="p-3 hover:bg-slate-100 cursor-pointer text-sm border-b last:border-0">
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
                <LocationMarker position={position} setPosition={setPosition} setAddress={setAddress} setSearchQuery={setSearchQuery} />
              </MapContainer>
            </div>
          </div>

          <button type="submit" disabled={loading || isCompressing || aiLoading}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg flex justify-center items-center gap-2 disabled:bg-slate-400">
            {loading ? <Loader2 className="animate-spin" /> : "Submit Final Report"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReportIssue;