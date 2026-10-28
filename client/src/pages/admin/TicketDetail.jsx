import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../../api/client.js";
import usePolling from "../../hooks/usePolling.js";
import Badge from "../../components/Badge.jsx";
import TicketThread from "../../components/TicketThread.jsx";
import { CATEGORIES, PRIORITIES, STATUSES, formatDateTime, formatMoney } from "../../utils/format.js";

const SOURCE_LABEL = { ai: "AI", rules: "keyword rules", admin: "you", pending: "pending" };

export default function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");

  const [reply, setReply] = useState("");
  const [markResolved, setMarkResolved] = useState(false);
  const [sending, setSending] = useState(false);

  const [note, setNote] = useState("");

  // ai: idle | loading | ready | failed
  const [ai, setAi] = useState({ state: "idle", message: "" });
  const draftRequested = useRef(false);

  async function loadTicket() {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.ticket);
      setError("");
      return res.data.ticket;
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  // Ask the server for a draft. If AI is down the admin just writes the reply by hand.
  async function fetchDraft(regenerate = false) {
    setAi({ state: "loading", message: "" });
    try {
      const res = await api.post(`/tickets/${id}/ai-draft`, { regenerate });
      setReply(res.data.draft);
      setAi({ state: "ready", message: res.data.cached ? "Showing the saved AI draft." : "" });
    } catch (err) {
      setAi({ state: "failed", message: getErrorMessage(err) });
    }
  }

  // keep the ticket fresh (author replies, other admins' changes)
  usePolling(
    async () => {
      const t = await loadTicket();
      const finished = t && (t.status === "Resolved" || t.status === "Closed");
      // only generate a draft once per visit, and not for finished tickets (saves cost)
      if (t && !draftRequested.current && !finished) {
        draftRequested.current = true;
        fetchDraft(false);
      }
    },
    10000,
    [id]
  );

  async function update(changes) {
    try {
      const res = await api.patch(`/tickets/${id}`, changes);
      setTicket((prev) => ({ ...prev, ...res.data.ticket }));
      // draft was written for the old category, so ask for a fresh one
      if (changes.category && !reply.trim()) fetchDraft(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function sendReply(e) {
    e.preventDefault();
    setSending(true);
    try {
      await api.post(`/tickets/${id}/responses`, { message: reply, markResolved });
      setReply("");
      setMarkResolved(false);
      setAi({ state: "idle", message: "" });
      await loadTicket();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function addNote(e) {
    e.preventDefault();
    try {
      await api.post(`/tickets/${id}/notes`, { note });
      setNote("");
      await loadTicket();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (!ticket) return error ? <div className="alert alert-error">{error}</div> : <p>Loading ticket...</p>;

  const book = ticket.book;

  return (
    <div>
      <Link to="/admin/tickets" className="back-link">← Back to queue</Link>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-layout">
        {/* Left: conversation + reply box */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2>{ticket.subject}</h2>
              <Badge type="status" value={ticket.status} />
            </div>
            <p className="muted">
              From {ticket.author?.name} ({ticket.author?.email}) · {formatDateTime(ticket.createdAt)}
              {" · "}{book ? book.title : "General / Account Level"}
            </p>
            <TicketThread ticket={ticket} />
          </div>

          <form className="card" onSubmit={sendReply}>
            <div className="card-header">
              <h3>Reply to author</h3>
              <button
                type="button"
                className="btn btn-small btn-outline"
                disabled={ai.state === "loading"}
                onClick={() => fetchDraft(true)}
              >
                {ai.state === "loading" ? "Drafting..." : "Regenerate AI draft"}
              </button>
            </div>

            {ai.state === "loading" && <p className="hint">Writing a draft from the knowledge base...</p>}
            {ai.state === "ready" && (
              <p className="hint">AI draft below. Please review and edit before sending. {ai.message}</p>
            )}
            {ai.state === "failed" && (
              <div className="alert alert-warn">{ai.message} You can still write your reply below.</div>
            )}

            <textarea
              rows={10}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write your reply..."
              required
            />

            <label className="inline">
              <input type="checkbox" checked={markResolved} onChange={(e) => setMarkResolved(e.target.checked)} />
              Mark ticket as resolved after sending
            </label>

            <button className="btn" disabled={sending || !reply.trim()}>
              {sending ? "Sending..." : "Send reply"}
            </button>
          </form>
        </div>

        {/* Right: management panel */}
        <aside>
          <div className="card">
            <h3>Manage ticket</h3>

            <label>Status</label>
            <select value={ticket.status} onChange={(e) => update({ status: e.target.value })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>

            <label>Category <span className="muted small">(set by {SOURCE_LABEL[ticket.categorySource]})</span></label>
            <select value={ticket.category} onChange={(e) => update({ category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>

            <label>Priority <span className="muted small">(set by {SOURCE_LABEL[ticket.prioritySource]})</span></label>
            <select value={ticket.priority} onChange={(e) => update({ priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
            {ticket.aiReason && <p className="hint">{ticket.aiReason}</p>}

            <label>Assigned to</label>
            <p>{ticket.assignedTo?.name || "Nobody yet"}</p>
            <button className="btn btn-small btn-outline" onClick={() => update({ assignedTo: "me" })}>
              Assign to me
            </button>
          </div>

          {book && (
            <div className="card">
              <h3>Book details</h3>
              <dl className="details">
                <dt>Title</dt><dd>{book.title}</dd>
                <dt>Book ID</dt><dd>{book.bookId}</dd>
                <dt>Status</dt><dd>{book.status}</dd>
              </dl>
            </div>
          )}

          <div className="card">
            <h3>Internal notes</h3>
            <p className="hint">Only visible to the BookLeaf team.</p>
            {ticket.internalNotes.length === 0 && <p className="muted">No notes yet.</p>}
            {ticket.internalNotes.map((n) => (
              <div className="note" key={n._id}>
                <p>{n.note}</p>
                <span className="muted small">{n.adminName} · {formatDateTime(n.createdAt)}</span>
              </div>
            ))}
            <form onSubmit={addNote}>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." />
              <button className="btn btn-small" disabled={!note.trim()}>Add note</button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
