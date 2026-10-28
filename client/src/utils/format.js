export const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];
export const PRIORITIES = ["Critical", "High", "Medium", "Low"];
export const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMoney(value) {
  if (value === null || value === undefined) return "-";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

// how many full days a ticket has been waiting
export function daysOld(value) {
  return Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));
}
