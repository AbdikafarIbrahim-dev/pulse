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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-[#3B2E8A] to-[#4C3AA8]">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link to="/dashboard" className="text-sm text-white/80 hover:text-white transition-colors">
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold text-slate-900">
          AI Health Companion
        </h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Ask questions about your own medical records. This is not medical advice.
        </p>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 min-h-[320px] max-h-[420px] overflow-y-auto mb-4">
          {messages.length === 0 && (
            <p className="text-slate-400 text-sm">Ask a question to get started.</p>
          )}
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap transition-all duration-200 ${
                    msg.role === "user"
                      ? "bg-[#4C3AA8] text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          {loading && (
            <div className="flex items-center gap-2 mt-2 text-slate-400 text-sm">
              <span className="w-3 h-3 border-2 border-[#4C3AA8]/30 border-t-[#4C3AA8] rounded-full animate-spin" />
              Thinking...
            </div>
          )}
        </div>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            placeholder="Ask about your records..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#4C3AA8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[#3B2E8A] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

export default AICompanion;