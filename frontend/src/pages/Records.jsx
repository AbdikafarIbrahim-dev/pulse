import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";

function Records() {
  const [records, setRecords] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
      <Link to="/dashboard">&larr; Back to Dashboard</Link>
      <h1>My Medical Records</h1>

      <form onSubmit={handleAddRecord} style={{ marginBottom: "30px" }}>
        <h3>Add a Record</h3>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Title (e.g. Blood Test Results)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
            rows={3}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ padding: "10px 20px" }}>
          Add Record
        </button>
      </form>

      <h3>Your Records</h3>
      {loading ? (
        <p>Loading records...</p>
      ) : records.length === 0 ? (
        <p>No records yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {records.map((record) => (
            <li
              key={record.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "10px",
              }}
            >
              <strong>{record.title}</strong>
              <p style={{ margin: "4px 0" }}>{record.description || "No description"}</p>
              <small>{new Date(record.created_at).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Records;