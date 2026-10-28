import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client.js";
import { formatDate, formatMoney } from "../../utils/format.js";

export default function MyBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/books")
      .then((res) => setBooks(res.data.books))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading your books...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (books.length === 0) return <p className="muted">You don't have any books with BookLeaf yet.</p>;

  return (
    <div>
      <h2>My Books</h2>
      <div className="grid">
        {books.map((book) => {
          const inProduction = book.status.startsWith("In Production");
          return (
            <div className="card" key={book._id}>
              <div className="card-header">
                <h3>{book.title}</h3>
                <span className={`badge ${inProduction ? "status-in-progress" : "status-resolved"}`}>
                  {book.status}
                </span>
              </div>
              <p className="muted">{book.genre}</p>

              <dl className="details">
                <dt>ISBN</dt><dd>{book.isbn}</dd>
                <dt>Published</dt><dd>{book.publicationDate ? formatDate(book.publicationDate) : "Not published yet"}</dd>
                <dt>MRP</dt><dd>{formatMoney(book.mrp)}</dd>
              </dl>

              {inProduction ? (
                <p className="muted">
                  Sales and royalty details will appear here once your book goes live.
                </p>
              ) : (
                <dl className="details">
                  <dt>Copies sold</dt><dd>{book.totalCopiesSold}</dd>
                  <dt>Royalty earned</dt><dd>{formatMoney(book.totalRoyaltyEarned)}</dd>
                  <dt>Royalty paid</dt><dd>{formatMoney(book.royaltyPaid)}</dd>
                  <dt>Royalty pending</dt><dd>{formatMoney(book.royaltyPending)}</dd>
                  {book.royaltyPaid === 0 && book.royaltyPending > 0 && (
                    <p className="hint">No payout has been made for this book yet.</p>
                  )}
                </dl>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
