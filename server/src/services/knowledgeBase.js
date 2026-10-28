// BookLeaf knowledge base, split into small sections so we only send
// the parts that matter for a given ticket (saves tokens on every call).

const company = `BookLeaf Publishing is a self-publishing company in India and the US.
Packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid, with marketing and distribution add-ons).
We handle cover design, typesetting, ISBN assignment, printing, distribution and royalty management.
In-house printing facility and warehouse are in Delhi. Print partners: Repro India and Epitome Books.`;

const tone = `TONE GUIDELINES
- Empathetic and professional. Authors are partners, not customers to be managed.
- Acknowledge the author's concern before jumping to solutions.
- Be specific: use actual numbers, dates and statuses instead of vague reassurance.
- If something is BookLeaf's fault (delayed royalty, ISBN error), own it directly. No corporate deflection.
- If escalation or investigation is needed, give a clear timeline (e.g. "within 48 hours"), not open-ended promises.
- Always end with a clear next step for the author and/or the BookLeaf team.`;

// one entry per ticket category
const sections = {
  "Royalty & Payments": `ROYALTY POLICY
- 80/20 split: 80% of net profit per book goes to the author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart) and shipping charges.
- Royalties are calculated quarterly and paid within 45 days of the quarter ending.
- Minimum payout threshold is Rs 1,000. Below that, royalties roll over to the next quarter.
- Payouts are bank transfers to the account linked in the author's dashboard.
- Authors can see a detailed royalty breakdown (sales per platform) in their dashboard.`,

  "ISBN & Metadata Issues": `ISBN POLICY
- Every book gets a unique ISBN assigned by BookLeaf, registered under BookLeaf's publisher imprint.
- An author who wants an ISBN under their own imprint must obtain it independently.
- ISBN errors (duplicate, wrong book linked) are HIGH PRIORITY and escalated to the production team.
METADATA
- Metadata updates (e.g. book description on Amazon) can be submitted via the dashboard or by emailing the BookLeaf team. Changes reflect on platforms within 3-5 business days.`,

  "Printing & Quality": `PRINTING & QUALITY
- In-house printing handles most orders. Overflow or special formats go to Repro India or Epitome Books.
- Standard print turnaround: 5-7 business days from order confirmation.
- Quality issues (misprints, binding defects, colour inconsistency): BookLeaf arranges a free reprint after verification. The author may need to share photos of the defective copy.`,

  "Distribution & Availability": `DISTRIBUTION
- Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK and the BookLeaf Store.
- New listings go live within 7-10 business days after publication is complete.
- A book showing as unavailable on a platform is usually a stock sync issue. The team can trigger a re-sync, which takes 24-48 hours.`,

  "Book Status & Production Updates": `PRODUCTION STAGES
Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.
- Authors get an email at each stage.
- Delays usually happen at Cover Design (waiting for author approval) and Proofreading (revision rounds).
- Never blame the author for a delay, even if it is on their side. Frame it collaboratively.`,

  "General Inquiry": `GENERAL
- Metadata updates (like a book description on Amazon) can be submitted via the dashboard or by emailing the BookLeaf team. Changes reflect within 3-5 business days.`,
};

// Short calibration examples (query -> how to respond), one per category
const examples = {
  "Royalty & Payments": `Example: Author says no royalty after 4 months -> acknowledge frustration, explain the quarterly cycle and 45-day window, give the specific next payout date, and if truly overdue escalate with a 48-hour resolution timeline.
Example: Author says royalty too low -> explain net profit (MRP minus printing, platform commission, shipping), offer a line-by-line breakdown, do not be defensive.`,
  "ISBN & Metadata Issues": `Example: ISBN on Amazon differs from the physical copy -> treat as high priority, acknowledge it is a serious data issue, confirm escalation to the production team, give a 48-hour timeline.`,
  "Printing & Quality": `Example: Blurry images, misaligned pages -> apologise sincerely, ask for photos of the defective copies, confirm a free reprint once verified, timeline 5-7 business days.`,
  "Distribution & Availability": `Example: Shows "Currently Unavailable" on Amazon -> explain it is typically a stock sync issue, confirm you are triggering a re-sync, expect 24-48 hours.`,
  "Book Status & Production Updates": `Example: Book stuck in typesetting for 3 weeks -> check the actual status, be honest about the reason, give a specific updated timeline.`,
  "General Inquiry": `Example: Can I update my book description on Amazon? -> yes, via dashboard or email, reflects in 3-5 business days.`,
};

export function getKnowledgeFor(category) {
  const key = sections[category] ? category : "General Inquiry";
  return {
    company,
    tone,
    policy: sections[key],
    examples: examples[key],
  };
}
