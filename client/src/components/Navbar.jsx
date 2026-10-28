import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const isAdmin = user?.role === "admin";

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="brand">BookLeaf {isAdmin ? "Admin" : "Author Portal"}</span>
        <nav>
          {isAdmin ? (
            <NavLink to="/admin/tickets">Ticket Queue</NavLink>
          ) : (
            <>
              <NavLink to="/books">My Books</NavLink>
              <NavLink to="/tickets/new">Submit Query</NavLink>
              <NavLink to="/tickets" end>My Tickets</NavLink>
            </>
          )}
        </nav>
        <div className="navbar-user">
          <span>{user?.name}</span>
          <button className="btn btn-small btn-outline" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
