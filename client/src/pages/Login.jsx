import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../api/client.js";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin/tickets" : "/books"} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      navigate(loggedIn.role === "admin" ? "/admin/tickets" : "/books");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>BookLeaf Support</h1>
        <p className="muted">Log in to view your books and talk to our team.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button className="btn" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
      </form>
    </div>
  );
}
