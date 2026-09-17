import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";

function SharedRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const response = await apiClient.get("/shared-with-me");
        setRecords(response.data);
      } catch (err) {
        setError("Failed to load shared records");
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-[#3B2E8A] to-[#4C3AA8]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to="/dashboard" className="text-sm text-white/80 hover:text-white transition-colors">
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold text-slate-900 mb-2">
          Shared With Me
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Medical records patients have explicitly shared with you.
        </p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        {loading ? (
          <span className="inline-block w-5 h-5 border-2 border-[#4C3AA8]/30 border-t-[#4C3AA8] rounded-full animate-spin" />
        ) : records.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No records have been shared with you yet.
          </p>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white border border-slate-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900 text-sm">
                    {record.title}
                  </h3>
                  <span className="text-xs font-medium text-[#4C3AA8] bg-[#4C3AA8]/10 px-2 py-0.5 rounded-full">
                    {record.patient_name}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {record.description || "No description"}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(record.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default SharedRecords;