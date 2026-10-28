import { useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../../api/client.js";
import usePolling from "../../hooks/usePolling.js";
import Badge from "../../components/Badge.jsx";
import TicketThread from "../../components/TicketThread.jsx";
import { formatDateTime } from "../../utils/format.js";

export default function MyTickets() {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  // checks for new replies every 5 seconds, so no page refresh is needed
  usePolling(async () => {
    try {
      const res = await api.get("/tickets");
      setTickets(res.data.tickets);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, 5000);

  if (!tickets && !error) return <p>Loading your tickets...</p>;

  return (
    <div>
      <div className="page-header">
        <h2>My Tickets</h2>
        <Link className="btn btn-small" to="/tickets/new">New query</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {tickets && tickets.length === 0 && (
        <div className="card empty">
          <p>You haven't raised any queries yet.</p>
          <Link className="btn" to="/tickets/new">Submit your first query</Link>
        </div>
      )}

      {tickets?.map((t) => {
        const open = openId === t._id;
        return (
          <div className="card ticket-card" key={t._id}>
            <div className="ticket-row" onClick={() => setOpenId(open ? null : t._id)}>
              <div>
                <h3>{t.subject}</h3>
                <p className="muted">
                  {t.book ? t.book.title : "General / Account Level"} · {formatDateTime(t.createdAt)}
                  {t.responses.length > 0 && ` · ${t.responses.length} repl${t.responses.length === 1 ? "y" : "ies"}`}
                </p>
              </div>
              <Badge type="status" value={t.status} />
            </div>
            {open && <TicketThread ticket={t} />}
          </div>
        );
      })}
    </div>
  );
}
