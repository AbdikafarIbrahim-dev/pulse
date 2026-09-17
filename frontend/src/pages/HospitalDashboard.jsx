import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";

function HospitalDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [hospitalName, setHospitalName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsHospital, setNeedsHospital] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await apiClient.get("/hospitals/dashboard");
      setDashboard(response.data);
      setNeedsHospital(false);
    } catch (err) {
      if (err.response?.status === 400) {
        setNeedsHospital(true);
      } else {
        setError("Failed to load hospital dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateHospital = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiClient.post("/hospitals", { name: hospitalName });
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create hospital");
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
          Hospital Dashboard
        </h1>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        {loading ? (
          <span className="inline-block w-5 h-5 border-2 border-[#4C3AA8]/30 border-t-[#4C3AA8] rounded-full animate-spin" />
        ) : needsHospital ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              Create Your Hospital
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              You're not associated with a hospital yet. Create one to get started.
            </p>
            <form onSubmit={handleCreateHospital} className="flex gap-2">
              <input
                type="text"
                placeholder="Hospital name"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
              />
              <button
                type="submit"
                className="bg-[#4C3AA8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[#3B2E8A] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                Create
              </button>
            </form>
          </div>
        ) : dashboard ? (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {dashboard.hospital.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Hospital ID: {dashboard.hospital.id} — share this with staff so
                they can join
              </p>
              <div className="grid grid-cols-3 gap-4 mt-5">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#4C3AA8]">
                    {dashboard.staff.length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Staff</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#4C3AA8]">
                    {dashboard.total_appointments}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Appointments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#4C3AA8]">
                    {dashboard.total_orders}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Orders</p>
                </div>
              </div>
            </div>

            <h2 className="text-sm font-semibold text-slate-900 mb-3">Staff</h2>
            {dashboard.staff.length === 0 ? (
              <p className="text-slate-500 text-sm">No staff have joined yet.</p>
            ) : (
              <div className="space-y-3">
                {dashboard.staff.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between transition-all duration-200 hover:shadow-md"
                  >
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {s.full_name}
                      </p>
                      <p className="text-sm text-slate-500">{s.email}</p>
                    </div>
                    <span className="text-xs font-medium text-[#4C3AA8] bg-[#4C3AA8]/10 px-2 py-0.5 rounded-full capitalize">
                      {s.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}

export default HospitalDashboard;