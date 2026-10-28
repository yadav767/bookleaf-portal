import Ticket from "../models/Ticket.js";
import { classifyTicket } from "./aiService.js";
import { keywordClassify } from "./keywordClassifier.js";

// Runs after a ticket is created. It never blocks the author's request,
// and if the AI fails we fall back to keyword rules so the ticket still gets sorted.
export async function autoClassifyTicket(ticketId) {
  try {
    const ticket = await Ticket.findById(ticketId).populate("book");
    if (!ticket) return;

    let result;
    let source = "ai";
    try {
      result = await classifyTicket({
        subject: ticket.subject,
        description: ticket.description,
        book: ticket.book,
      });
    } catch (err) {
      console.warn(`AI classification failed for ticket ${ticketId}: ${err.message}. Using keyword rules.`);
      result = keywordClassify(ticket);
      source = "rules";
    }

    // re-read so we don't overwrite an admin override that happened in the meantime
    const fresh = await Ticket.findById(ticketId);
    if (fresh.categorySource === "pending") {
      fresh.category = result.category;
      fresh.categorySource = source;
    }
    if (fresh.prioritySource === "pending") {
      fresh.priority = result.priority;
      fresh.prioritySource = source;
    }
    fresh.aiReason = result.reason;
    await fresh.save();
  } catch (err) {
    console.error("autoClassifyTicket crashed:", err.message);
  }
}
