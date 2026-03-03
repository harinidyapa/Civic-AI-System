import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { Upload, MapPin, AlertCircle, Trash2, Search, X, Camera, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to handle map center updates when searching
function ChangeView({ center }) {
  const map = useMap();
  if (center) map.setView(center, 16);
  return null;
}

// Marker component
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
  return position ? <Marker position={position}></Marker> : null;
}

// Geocoding Helpers
async function reverseGeocode(lat, lng, callback) {
  try {
    const response = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
    const data = await response.json();
    if (data.features?.length > 0) {
      const props = data.features[0].properties;
      const addr = props.name || props.street || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      callback(addr);
    }
  } catch (err) {
    console.error("Reverse geocoding error:", err);
  }
}

async function searchAddress(query) {
  if (query.length < 3) return [];
  try {
    const response = await fetch(`https://photon.komoot.io/api?q=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();
    return data.features || [];
  } catch (err) {
    console.error("Search error:", err);
    return [];
  }
}

function ReportIssue() {
  const [formData, setFormData] = useState({ title: "", description: "", category: "" });
  const [images, setImages] = useState([]); // Separate state for easier manipulation
  const [imagePreviews, setImagePreviews] = useState([]);
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [geoLoading, setGeoLoading] = useState(true);
  
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

    for (const file of files) {
      try {
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        
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
    e.target.value = ""; // Clear input to allow re-selection
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSearch = (val) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.length < 3) {
      setSuggestions([]);
      return;
    }
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
        <div className="bg-red-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold flex justify-center items-center gap-2">
            <AlertCircle /> Report Civil Issue
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Issue Title</label>
              <input 
                name="title" 
                required 
                onChange={handleInputChange} 
                placeholder="Brief title"
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none" 
              />
              
              <label className="block text-sm font-bold text-slate-700">Category</label>
              <select 
                name="category" 
                required 
                onChange={handleInputChange}
                className="w-full p-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="">Select Category</option>
                <option value="Pothole">Pothole</option>
                <option value="Garbage">Garbage</option>
                <option value="Streetlight">Streetlight</option>
                <option value="Water Leakage">Water Leakage</option>
              </select>

              <label className="block text-sm font-bold text-slate-700">Description</label>
              <textarea 
                name="description" 
                rows="4" 
                required 
                onChange={handleInputChange}
                placeholder="Tell us more about the problem..."
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
              ></textarea>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Evidence (Max 3)</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50">
                  <Camera className="text-slate-400" />
                  <span className="text-xs mt-1 text-slate-500">Camera</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                </label>
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50">
                  <Upload className="text-slate-400" />
                  <span className="text-xs mt-1 text-slate-500">Gallery</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                </label>
              </div>

              {isCompressing && <p className="text-xs text-blue-600 animate-pulse">Processing images...</p>}

              <div className="flex gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={src} className="w-full h-full object-cover rounded-lg border" alt="preview" />
                    <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"><X size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700">Search Location</label>
            <div className="relative">
              <div className="flex items-center border border-slate-300 rounded-xl p-3 bg-white focus-within:ring-2 focus-within:ring-red-500">
                <Search className="text-slate-400 mr-2" size={18} />
                <input 
                  value={searchQuery} 
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Type address like Uber..." 
                  className="w-full outline-none text-sm"
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-white border rounded-xl mt-1 shadow-2xl max-h-48 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <div key={i} onClick={() => selectSuggestion(s)} className="p-3 hover:bg-slate-100 cursor-pointer text-sm border-b last:border-0">
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

          <button 
            type="submit" 
            disabled={loading || isCompressing}
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