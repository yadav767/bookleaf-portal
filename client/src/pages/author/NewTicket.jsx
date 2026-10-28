import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../api/client.js";

export default function NewTicket() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ bookId: "", subject: "", description: "", attachmentName: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/books").then((res) => setBooks(res.data.books)).catch(() => {});
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Upload is UI only for now, we just keep the file name
  function handleFile(e) {
    const file = e.target.files[0];
    setForm({ ...form, attachmentName: file ? file.name : "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/tickets", {
        bookId: form.bookId || null,
        subject: form.subject,
        description: form.description,
        attachmentName: form.attachmentName || undefined,
      });
      navigate("/tickets");
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h2>Submit a Support Query</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <label>Which book is this about?</label>
      <select name="bookId" value={form.bookId} onChange={handleChange}>
        <option value="">General / Account Level</option>
        {books.map((b) => (
          <option key={b._id} value={b._id}>{b.title}</option>
        ))}
      </select>

      <label>Subject</label>
      <input name="subject" value={form.subject} onChange={handleChange} maxLength={150} required />

      <label>Describe your query</label>
      <textarea name="description" rows={6} value={form.description} onChange={handleChange} required />

      <label>Attachment (optional)</label>
      <input type="file" onChange={handleFile} />
      <p className="hint">Screenshots or photos help us look into printing issues faster.</p>

      <button className="btn" disabled={saving}>{saving ? "Submitting..." : "Submit query"}</button>
    </form>
  );
}
