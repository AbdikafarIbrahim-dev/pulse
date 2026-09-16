import { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";

function AICompanion() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post("/ai/ask", { question });
      const aiMessage = { role: "ai", text: response.data.answer };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError("Failed to get a response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
      <Link to="/dashboard">&larr; Back to Dashboard</Link>
      <h1>AI Health Companion</h1>
      <p style={{ color: "#666", fontSize: "14px" }}>
        Ask questions about your own medical records. This is not medical advice.
      </p>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "6px",
          padding: "16px",
          minHeight: "300px",
          maxHeight: "400px",
          overflowY: "auto",
          marginBottom: "16px",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#999" }}>Ask a question to get started.</p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "12px",
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: msg.role === "user" ? "#dceeff" : "#f0f0f0",
                maxWidth: "80%",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
        {loading && <p style={{ color: "#999" }}>Thinking...</p>}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleAsk} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="Ask about your records..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ flex: 1, padding: "10px" }}
        />
        <button type="submit" disabled={loading} style={{ padding: "10px 20px" }}>
          Send
        </button>
      </form>
    </div>
  );
}

export default AICompanion;