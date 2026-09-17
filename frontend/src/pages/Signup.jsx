import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(fullName, email, password, role);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#3B2E8A] via-[#4C3AA8] to-[#6B4FD8] px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#4C3AA8] tracking-tight">
            Pulse
          </h1>
          <p className="text-slate-500 text-sm mt-1">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              I am a...
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="lab">Lab</option>
              <option value="admin">Hospital Admin</option>
            </select>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4C3AA8] text-white py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[#3B2E8A] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#4C3AA8] font-medium hover:underline underline-offset-2"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;