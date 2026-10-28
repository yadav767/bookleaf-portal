import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../api/client.js";
import usePolling from "../../hooks/usePolling.js";
import Badge from "../../components/Badge.jsx";
import { CATEGORIES, PRIORITIES, STATUSES, daysOld, formatDate } from "../../utils/format.js";

const emptyFilters = { status: "", category: "", priority: "", assigned: "", from: "", to: "", q: "" };

export default function TicketQueue() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(emptyFilters);
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState("");

  function handleChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  // refresh every 15s and whenever a filter changes
  usePolling(
    async () => {
      try {
        const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
        const res = await api.get("/tickets", { params });
        setTickets(res.data.tickets);
        setError("");
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    15000,
    [JSON.stringify(filters)]
  );

  const unresolved = (t) => t.status === "Open" || t.status === "In Progress";
  const openCount = tickets ? tickets.filter(unresolved).length : 0;
  const criticalCount = tickets ? tickets.filter((t) => unresolved(t) && t.priority === "Critical").length : 0;

  return (
    <div>
      <div className="page-header">
        <h2>Ticket Queue</h2>
        {tickets && (
          <p className="muted">
            {openCount} unresolved · {criticalCount} critical
          </p>
        )}
      </div>

      <div className="card filters">
        <input name="q" placeholder="Search subject..." value={filters.q} onChange={handleChange} />
        <select name="status" value={filters.status} onChange={handleChange}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select name="category" value={filters.category} onChange={handleChange}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="priority" value={filters.priority} onChange={handleChange}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select name="assigned" value={filters.assigned} onChange={handleChange}>
          <option value="">Anyone</option>
          <option value="me">Assigned to me</option>
          <option value="none">Unassigned</option>
        </select>
        <input type="date" name="from" value={filters.from} onChange={handleChange} title="From date" />
        <input type="date" name="to" value={filters.to} onChange={handleChange} title="To date" />
        <button className="btn btn-small btn-outline" onClick={() => setFilters(emptyFilters)}>Clear</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!tickets && !error && <p>Loading tickets...</p>}
      {tickets && tickets.length === 0 && <p className="muted">No tickets match these filters.</p>}

      {tickets && tickets.length > 0 && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Subject</th>
                <th>Author</th>
                <th>Category</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const age = daysOld(t.createdAt);
                const stale = unresolved(t) && age >= 3;
                return (
                  <tr key={t._id} className="clickable" onClick={() => navigate(`/admin/tickets/${t._id}`)}>
                    <td><Badge type="priority" value={t.priority} /></td>
                    <td>
                      <strong>{t.subject}</strong>
                      <div className="muted small">{t.book ? t.book.title : "General / Account Level"}</div>
                    </td>
                    <td>{t.author?.name}</td>
                    <td>
                      {t.category}
                      {t.categorySource === "pending" && <div className="muted small">classifying...</div>}
                    </td>
                    <td><Badge type="status" value={t.status} /></td>
                    <td>{t.assignedTo?.name || <span className="muted">Unassigned</span>}</td>
                    <td className={stale ? "stale" : ""} title={formatDate(t.createdAt)}>
                      {age === 0 ? "Today" : `${age}d`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
