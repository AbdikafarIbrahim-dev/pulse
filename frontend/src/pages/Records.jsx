import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";

function Records() {
  const [records, setRecords] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shareInputs, setShareInputs] = useState({});
  const [sharingId, setSharingId] = useState(null);

  const fetchRecords = async () => {
    try {
      const response = await apiClient.get("/records");
      setRecords(response.data);
    } catch (err) {
      setError("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiClient.post("/records", { title, description });
      setTitle("");
      setDescription("");
      fetchRecords();
    } catch (err) {
      setError("Failed to add record");
    }
  };

  const handleShare = async (recordId) => {
    const doctorEmail = shareInputs[recordId];
    if (!doctorEmail) return;
    setError("");
    setSuccess("");
    try {
      await apiClient.post(`/records/${recordId}/share`, { doctor_email: doctorEmail });
      setSuccess("Record shared successfully.");
      setShareInputs((prev) => ({ ...prev, [recordId]: "" }));
      setSharingId(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to share record");
    }
  };

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
        <h1 className="text-xl font-semibold text-slate-900 mb-6">
          Medical Records
        </h1>

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Add a Record
          </h2>
          <form onSubmit={handleAddRecord} className="space-y-3">
            <input
              type="text"
              placeholder="Title (e.g. Blood Test Results)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-emerald-600 text-sm">{success}</p>}
            <button
              type="submit"
              className="bg-[#4C3AA8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[#3B2E8A] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Add Record
            </button>
          </form>
        </div>

        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Your Records
        </h2>
        {loading ? (
          <span className="inline-block w-5 h-5 border-2 border-[#4C3AA8]/30 border-t-[#4C3AA8] rounded-full animate-spin" />
        ) : records.length === 0 ? (
          <p className="text-slate-500 text-sm">No records yet.</p>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white border border-slate-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
              >
                <h3 className="font-medium text-slate-900 text-sm">
                  {record.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {record.description || "No description"}
                </p>
                <p className="text-xs text-slate-400 mt-2 mb-3">
                  {new Date(record.created_at).toLocaleString()}
                </p>

                {sharingId === record.id ? (
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Doctor's email"
                      value={shareInputs[record.id] || ""}
                      onChange={(e) =>
                        setShareInputs((prev) => ({ ...prev, [record.id]: e.target.value }))
                      }
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
                    />
                    <button
                      onClick={() => handleShare(record.id)}
                      className="text-sm px-3 py-1.5 bg-[#4C3AA8] text-white rounded-lg hover:bg-[#3B2E8A] transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setSharingId(null)}
                      className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSharingId(record.id)}
                    className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg transition-colors hover:bg-[#4C3AA8]/5 hover:border-[#4C3AA8]/40"
                  >
                    Share with a doctor
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Records;