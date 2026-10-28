
const CATEGORY_KEYWORDS = [
  ["ISBN & Metadata Issues", ["isbn", "metadata", "wrong book", "duplicate", "description", "author bio"]],
  ["Royalty & Payments", ["royalty", "royalties", "payment", "payout", "bank", "paid", "earning"]],
  ["Printing & Quality", ["print", "misprint", "blurry", "binding", "quality", "damaged", "reprint", "pages"]],
  ["Distribution & Availability", ["amazon", "flipkart", "unavailable", "listing", "not showing", "out of stock", "available"]],
  ["Book Status & Production Updates", ["status", "typesetting", "cover design", "proof", "when will", "delay", "production"]],
];

const CRITICAL_WORDS = ["legal", "lawyer", "fraud", "scam", "complaint", "never received", "6 months", "six months"];
const HIGH_WORDS = ["isbn", "wrong", "duplicate", "not received", "haven't received", "still waiting", "unavailable", "urgent", "damaged"];
const LOW_WORDS = ["bio", "update my", "can i", "how do i", "question"];

export function keywordClassify({ subject, description }) {
  const text = `${subject} ${description}`.toLowerCase();

  let category = "General Inquiry";
  for (const [name, words] of CATEGORY_KEYWORDS) {
    if (words.some((w) => text.includes(w))) {
      category = name;
      break;
    }
  }

  let priority = "Medium";
  if (CRITICAL_WORDS.some((w) => text.includes(w))) priority = "Critical";
  else if (HIGH_WORDS.some((w) => text.includes(w))) priority = "High";
  else if (LOW_WORDS.some((w) => text.includes(w))) priority = "Low";

  return { category, priority, reason: "Set by keyword rules (AI unavailable)" };
}
