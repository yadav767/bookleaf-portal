// Builds the small bit of author/book context we give to the AI.
// We only send the book the ticket is about, not the author's full history.

const QUARTER_END_MONTHS = [2, 5, 8, 11]; // Mar, Jun, Sep, Dec (0-indexed)
const PAYOUT_WINDOW_DAYS = 45;

function formatDate(d) {
  if (!d) return "n/a";
  return new Date(d).toISOString().slice(0, 10);
}

// Next payout deadline = end of the current quarter + 45 days.
// If that deadline already passed, use the following quarter.
export function estimateNextPayoutDate(today = new Date()) {
  for (let offset = 0; offset < 2; offset++) {
    const year = today.getFullYear();
    const candidates = QUARTER_END_MONTHS.map((m) => new Date(year + offset, m + 1, 0)); // last day of month
    for (const quarterEnd of candidates) {
      const payoutBy = new Date(quarterEnd.getTime() + PAYOUT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      if (payoutBy >= today) {
        return { quarterEnd, payoutBy };
      }
    }
  }
  return null;
}

function describeBook(book) {
  if (book.status.startsWith("In Production")) {
    return [
      `Book: "${book.title}" (${book.bookId}), genre ${book.genre}`,
      `Status: ${book.status} (not published yet, no sales or royalties exist)`,
      `ISBN: ${book.isbn}`,
    ].join("\n");
  }

  const lines = [
    `Book: "${book.title}" (${book.bookId}), genre ${book.genre}`,
    `Status: ${book.status}, published ${formatDate(book.publicationDate)}`,
    `ISBN: ${book.isbn}`,
    `MRP: Rs ${book.mrp}, author royalty per copy: Rs ${book.royaltyPerCopy}`,
    `Copies sold: ${book.totalCopiesSold}`,
    `Royalty earned: Rs ${book.totalRoyaltyEarned}, paid: Rs ${book.royaltyPaid}, pending: Rs ${book.royaltyPending}`,
    `Last payout date: ${book.lastRoyaltyPayoutDate ? formatDate(book.lastRoyaltyPayoutDate) : "no payout made yet"}`,
    `Print partner: ${book.printPartner}`,
    `Available on: ${book.availableOn.join(", ") || "nowhere yet"}`,
  ];

  if (book.royaltyPending > 0 && book.royaltyPending < 1000) {
    lines.push("Note: pending royalty is below the Rs 1,000 minimum payout threshold, so it rolls over to the next quarter.");
  }
  if (book.royaltyPaid === 0 && book.totalRoyaltyEarned > 0) {
    lines.push("Note: royalties have been earned but nothing has been paid out yet.");
  }
  return lines.join("\n");
}

export function buildTicketContext({ author, book }) {
  const parts = [`Author: ${author.name}`];

  if (book) {
    parts.push(describeBook(book));
  } else {
    parts.push("Ticket is general / account level (no specific book selected).");
  }

  const next = estimateNextPayoutDate();
  if (next) {
    parts.push(
      `Next royalty cycle: quarter ends ${formatDate(next.quarterEnd)}, payout due by ${formatDate(next.payoutBy)}.`
    );
  }
  parts.push(`Today's date: ${formatDate(new Date())}`);
  return parts.join("\n");
}
