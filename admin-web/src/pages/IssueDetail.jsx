import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllIssues } from "../services/api";
import { ArrowLeft } from "lucide-react";

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAllIssues(localStorage.getItem("token"));
        const found = res.data.find((i) => i._id === id);
        setIssue(found);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [id]);

  if (!issue) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold mb-4 text-slate-800">{issue.title}</h1>
        <p className="text-slate-700 mb-4">{issue.description}</p>
        <div className="text-sm text-slate-600 mb-2">
          <p>Category: <span className="font-medium">{issue.category}</span></p>
          <p>Status: <span className="font-medium">{issue.status}</span></p>
          <p>Reported By: <span className="font-medium">{issue.reportedBy?.name}</span></p>
          <p>Location: <span className="font-medium">{issue.location?.address || `${issue.location?.lat?.toFixed(4)}, ${issue.location?.lng?.toFixed(4)}`}</span></p>
        </div>
        {issue.images && issue.images.length > 0 && (
          <div className="mt-4 space-y-4">
            {issue.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="Issue"
                className="w-full rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
