import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "./Navbar.jsx";

// Wrap routes that need a login. Pass role="admin" or role="author" to restrict further.
export default function ProtectedRoute({ role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin/tickets" : "/books"} replace />;
  }

  return (
    <>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
