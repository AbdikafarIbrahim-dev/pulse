import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-[#4C3AA8]/30 border-t-[#4C3AA8] rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    {
      show: user.role === "patient",
      to: "/records",
      title: "Medical Records",
      desc: "View and add your health records",
    },
    {
      show: user.role === "doctor",
      to: "/shared-records",
      title: "Shared With Me",
      desc: "Records patients have shared with you",
    },
    {
      show: user.role === "patient" || user.role === "doctor",
      to: "/appointments",
      title: "Appointments",
      desc:
        user.role === "doctor"
          ? "Manage your patient appointments"
          : "Book and track appointments",
    },
    {
      show: user.role === "patient",
      to: "/ai-companion",
      title: "AI Health Companion",
      desc: "Ask questions about your records",
    },
    {
      show:
        user.role === "patient" || user.role === "pharmacy" || user.role === "lab",
      to: "/marketplace",
      title: "Marketplace",
      desc:
        user.role === "patient"
          ? "Order medicine and lab tests"
          : "Manage your listings and orders",
    },
    {
      show: user.role === "admin",
      to: "/hospital",
      title: "Hospital Dashboard",
      desc: "Manage your hospital and staff",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-[#3B2E8A] to-[#4C3AA8] shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white tracking-tight">Pulse</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-white/80 hover:text-white font-medium transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8 pb-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Welcome, {user.full_name.split(" ")[0]}
          </h2>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-slate-500 text-sm">{user.email}</span>
            <span className="text-xs font-medium text-[#4C3AA8] bg-[#4C3AA8]/10 px-2 py-0.5 rounded-full capitalize">
              {user.role}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {cards
            .filter((c) => c.show)
            .map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="bg-white border border-slate-200 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-[#4C3AA8]/40 group"
              >
                <h3 className="font-semibold text-slate-900 text-sm group-hover:text-[#4C3AA8] transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">{card.desc}</p>
              </Link>
            ))}
        </div>

        {cards.filter((c) => c.show).length === 0 && (
          <p className="text-slate-500 text-sm">
            No features available for your role yet.
          </p>
        )}
      </main>
    </div>
  );
}

export default Dashboard;