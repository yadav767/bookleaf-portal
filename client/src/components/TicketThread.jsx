import { formatDateTime } from "../utils/format.js";

// Shows the author's original query followed by the replies. Used by both portals.
export default function TicketThread({ ticket }) {
  return (
    <div className="thread">
      <div className="message message-author">
        <div className="message-meta">
          <strong>{ticket.author?.name || "You"}</strong>
          <span>{formatDateTime(ticket.createdAt)}</span>
        </div>
        <p>{ticket.description}</p>
        {ticket.attachmentName && <p className="muted">Attachment: {ticket.attachmentName}</p>}
      </div>

      {ticket.responses.map((r) => (
        <div key={r._id} className={`message ${r.sender === "admin" ? "message-admin" : "message-author"}`}>
          <div className="message-meta">
            <strong>{r.sender === "admin" ? `BookLeaf Support${r.senderName ? ` (${r.senderName})` : ""}` : r.senderName}</strong>
            <span>{formatDateTime(r.createdAt)}</span>
          </div>
          <p>{r.message}</p>
        </div>
      ))}

      {ticket.responses.length === 0 && (
        <p className="muted">No reply from the BookLeaf team yet.</p>
      )}
    </div>
  );
}
