import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";

function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAppointments = async () => {
    try {
      const response = await apiClient.get("/appointments");
      setAppointments(response.data);
    } catch (err) {
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await apiClient.post("/appointments", {
        doctor_email: doctorEmail,
        scheduled_time: scheduledTime,
      });
      setDoctorEmail("");
      setScheduledTime("");
      setSuccess("Appointment booked.");
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to book appointment");
    }
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      await apiClient.patch(`/appointments/${appointmentId}/status`, { status });
      fetchAppointments();
    } catch (err) {
      setError("Failed to update appointment");
    }
  };

  const statusStyle = {
    pending: "text-amber-700 bg-amber-50 border-amber-200",
    confirmed: "text-emerald-700 bg-emerald-50 border-emerald-200",
    cancelled: "text-red-700 bg-red-50 border-red-200",
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
          Appointments
        </h1>

        {user?.role === "patient" && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Book an Appointment
            </h2>
            <form onSubmit={handleBook} className="space-y-3">
              <input
                type="email"
                placeholder="Doctor's email"
                value={doctorEmail}
                onChange={(e) => setDoctorEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
              />
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && <p className="text-emerald-600 text-sm">{success}</p>}
              <button
                type="submit"
                className="bg-[#4C3AA8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[#3B2E8A] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                Book
              </button>
            </form>
          </div>
        )}

        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          {user?.role === "doctor" ? "Your Appointments" : "My Appointments"}
        </h2>
        {loading ? (
          <span className="inline-block w-5 h-5 border-2 border-[#4C3AA8]/30 border-t-[#4C3AA8] rounded-full animate-spin" />
        ) : appointments.length === 0 ? (
          <p className="text-slate-500 text-sm">No appointments yet.</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white border border-slate-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(appt.scheduled_time).toLocaleString()}
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${statusStyle[appt.status] || "text-slate-600 bg-slate-50 border-slate-200"}`}
                  >
                    {appt.status}
                  </span>
                </div>
                {user?.role === "doctor" && appt.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(appt.id, "confirmed")}
                      className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg transition-colors hover:bg-[#4C3AA8]/5 hover:border-[#4C3AA8]/40"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(appt.id, "cancelled")}
                      className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg transition-colors hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Appointments;