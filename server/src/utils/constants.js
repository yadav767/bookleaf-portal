export const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

export const PRIORITIES = ["Critical", "High", "Medium", "Low"];

// lower number = more urgent, used for sorting the admin queue
export const PRIORITY_RANK = { Critical: 1, High: 2, Medium: 3, Low: 4 };

export const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export const ROLES = { AUTHOR: "author", ADMIN: "admin" };
