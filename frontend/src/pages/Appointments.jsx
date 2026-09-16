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
      setSuccess("Appointment booked!");
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

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
      <Link to="/dashboard">&larr; Back to Dashboard</Link>
      <h1>Appointments</h1>

      {user?.role === "patient" && (
        <form onSubmit={handleBook} style={{ marginBottom: "30px" }}>
          <h3>Book an Appointment</h3>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="email"
              placeholder="Doctor's email"
              value={doctorEmail}
              onChange={(e) => setDoctorEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
          <button type="submit" style={{ padding: "10px 20px" }}>
            Book
          </button>
        </form>
      )}

      <h3>{user?.role === "doctor" ? "Your Appointments" : "My Appointments"}</h3>
      {loading ? (
        <p>Loading...</p>
      ) : appointments.length === 0 ? (
        <p>No appointments yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {appointments.map((appt) => (
            <li
              key={appt.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "10px",
              }}
            >
              <p>
                <strong>{new Date(appt.scheduled_time).toLocaleString()}</strong>
              </p>
              <p>Status: {appt.status}</p>
              {user?.role === "doctor" && appt.status === "pending" && (
                <div>
                  <button
                    onClick={() => handleStatusUpdate(appt.id, "confirmed")}
                    style={{ marginRight: "8px", padding: "6px 12px" }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(appt.id, "cancelled")}
                    style={{ padding: "6px 12px" }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Appointments;