import { GoogleGenAI } from "@google/genai";
import AppError from "../utils/AppError.js";
import { CATEGORIES, PRIORITIES } from "../utils/constants.js";
import { getKnowledgeFor } from "./knowledgeBase.js";
import { buildTicketContext } from "./contextBuilder.js";

const REQUEST_TIMEOUT_MS = 20000;

let client = null;

// The client is created lazily so the app still boots without an API key
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError("AI is not configured. Please write the response manually.", 503);
  }
  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { timeout: REQUEST_TIMEOUT_MS },
    });
  }
  return client;
}

// One place that talks to the API. Any failure becomes a 503 so the
// rest of the app can fall back to manual mode.
async function callModel({ system, user, maxTokens }) {
  try {
    const res = await getClient().models.generateContent({
      model: process.env.AI_MODEL || "gemini-2.5-flash",
      contents: user,
      config: {
        systemInstruction: system,
        maxOutputTokens: maxTokens,
        temperature: 0.3,
      },
    });
    return res.text?.trim() || "";
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error("AI call failed:", err.status || "", err.message);
    const msg =
      err.status === 429
        ? "AI is rate limited right now. Please try again in a minute or write the response manually."
        : "AI is temporarily unavailable. Please write the response manually.";
    throw new AppError(msg, 503);
  }
}

// ---------- 1. Classification + priority (one cheap call) ----------

const CLASSIFY_SYSTEM = `You triage support tickets for BookLeaf Publishing, a self-publishing company.
Reply with ONLY a JSON object, no other text:
{"category": "...", "priority": "...", "reason": "..."}

category must be exactly one of:
${CATEGORIES.map((c) => `- ${c}`).join("\n")}

priority must be one of: Critical, High, Medium, Low.
- Critical: money not received for a long time (3+ months), legal or fraud threats, a published book completely missing or broken everywhere.
- High: ISBN errors (always at least High), wrong or damaged print copies, book unavailable on a platform, royalties missing or clearly wrong, an author who is clearly upset.
- Medium: production status questions, delays, royalty calculation questions, general problems with no urgency.
- Low: simple how-to or informational questions, small metadata or bio updates, no deadline.

reason is one short sentence (max 20 words).`;

function parseJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function classifyTicket({ subject, description, book }) {
  // only the essentials go to the model: no knowledge base, no history
  const user = [
    book ? `Book: "${book.title}" (status: ${book.status})` : "Book: none (general / account level)",
    `Subject: ${subject}`,
    `Description: ${description.slice(0, 1500)}`,
  ].join("\n");

  const text = await callModel({ system: CLASSIFY_SYSTEM, user, maxTokens: 150 });

  let result;
  try {
    result = parseJson(text);
  } catch {
    throw new AppError("AI returned an unreadable classification", 503);
  }

  // never trust the model blindly, check the values
  if (!CATEGORIES.includes(result.category) || !PRIORITIES.includes(result.priority)) {
    throw new AppError("AI returned an invalid classification", 503);
  }
  return {
    category: result.category,
    priority: result.priority,
    reason: String(result.reason || "").slice(0, 200),
  };
}

// ---------- 2. Draft response ----------

function buildDraftSystemPrompt(kb) {
  return `You are a support representative at BookLeaf Publishing writing a reply to an author.

ABOUT BOOKLEAF
${kb.company}

${kb.tone}

RELEVANT POLICY
${kb.policy}

${kb.examples}

RULES
- Use only facts from the policy and the author/book data given. Never invent dates, amounts, tracking numbers or promises that are not supported by them.
- Use the real numbers from the book data (copies sold, royalty earned, paid, pending, status) when they help answer the question.
- If the data does not contain what you need (for example bank details), say the team will check it, and give a timeline.
- If the book is still in production, there are no sales or royalties yet. Say so kindly and mention the current stage.
- Write in plain, warm English like a real person. No headings, no bullet lists, no "I hope this email finds you well", no mention that you are an AI.
- Start with "Hi <first name>,". Keep it under 180 words. End with a clear next step and sign off as "Team BookLeaf".
- Output only the reply text.`;
}

export async function draftResponse({ ticket, author, book }) {
  const kb = getKnowledgeFor(ticket.category);

  // For follow-ups include only the last 2 messages, not the whole thread
  const recent = ticket.responses
    .slice(-2)
    .map((r) => `${r.sender === "admin" ? "BookLeaf" : "Author"}: ${r.message.slice(0, 600)}`)
    .join("\n");

  const user = [
    "AUTHOR / BOOK DATA",
    buildTicketContext({ author, book }),
    "",
    `TICKET (category: ${ticket.category}, priority: ${ticket.priority})`,
    `Subject: ${ticket.subject}`,
    `Description: ${ticket.description.slice(0, 2000)}`,
    recent ? `\nEARLIER MESSAGES\n${recent}` : "",
    "",
    "Write the reply to the author.",
  ].join("\n");

  return callModel({ system: buildDraftSystemPrompt(kb), user, maxTokens: 500 });
}
