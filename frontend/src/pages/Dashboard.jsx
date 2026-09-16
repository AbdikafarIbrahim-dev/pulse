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
    return <p>Loading...</p>;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "60px auto", padding: "20px" }}>
      <h1>Pulse Dashboard</h1>
      <p>Welcome, {user.full_name}!</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>

      <div style={{ margin: "20px 0" }}>
        {user.role === "patient" && (
          <Link to="/records" style={{ marginRight: "16px" }}>
            My Medical Records
          </Link>
        )}
        {(user.role === "patient" || user.role === "doctor") && (
          <Link to="/appointments" style={{ marginRight: "16px" }}>
            Appointments
          </Link>
        )}
        {user.role === "patient" && (
          <Link to="/ai-companion" style={{ marginRight: "16px" }}>
            AI Health Companion
          </Link>
        )}
      </div>

      <button onClick={handleLogout} style={{ padding: "10px 20px" }}>
        Log Out
      </button>
    </div>
  );
}

export default Dashboard;