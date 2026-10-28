import Ticket from "../models/Ticket.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import { draftResponse } from "../services/aiService.js";
import { autoClassifyTicket } from "../services/ticketAutomation.js";

const isAdmin = (req) => req.user.role === "admin";

// Authors must never see internal notes, the AI draft or who it's assigned to
function toAuthorView(ticket) {
  const obj = ticket.toObject ? ticket.toObject() : ticket;
  delete obj.internalNotes;
  delete obj.aiDraft;
  delete obj.aiDraftAt;
  delete obj.aiReason;
  delete obj.assignedTo;
  return obj;
}

// Loads a ticket and makes sure the current user is allowed to see it
async function findTicketForUser(req) {

  const ticket = await Ticket.findById(req.params.id)
    .populate("book", "title bookId status")
    .populate("author", "name email")
    .populate("assignedTo", "name");


  if (!ticket){
    return res.status(404).json({ message: "Ticket not found" });
  };

  if (!isAdmin(req) && ticket.author._id.toString() !== req.user.id) {
    return res.status(404).json({ message: "Ticket not found" });
  }


  return ticket;
}

export async function createTicket(req, res, next) {
  try {
    const { bookId, subject, description, attachmentName } = req.body;

    let book = null;

    if (bookId) {
      book = await Book.findOne({ _id: bookId, owner: req.user.id });
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      };
    }

    const ticket = await Ticket.create({
      author: req.user.id,
      book: book ? book._id : null,
      subject,
      description,
      attachmentName,
    });

    // classify in the background, the author gets their response right away
    autoClassifyTicket(ticket._id);

    res.status(201).json({ ticket: toAuthorView(ticket) });
  } catch (err) {
    res.status(500).json({ message: "Failed to create ticket" });
  }
}

export async function listTickets(req, res, next) {
  try {
    const filter = {};

    if (!isAdmin(req)) {
      filter.author = req.user.id;
    } else {
      const { status, category, priority, from, to, assigned, q } = req.query;
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;
      if (assigned === "me") filter.assignedTo = req.user.id;
      if (assigned === "none") filter.assignedTo = null;
      if (q) filter.subject = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
      }
    }

    // Admin queue: most urgent first, then oldest first
    const sort = isAdmin(req) ? { priorityRank: 1, createdAt: 1 } : { createdAt: -1 };

    const tickets = await Ticket.find(filter)
      .populate("book", "title bookId")
      .populate("author", "name email")
      .populate("assignedTo", "name")
      .sort(sort)
      .limit(200);

    res.json({ tickets: isAdmin(req) ? tickets : tickets.map(toAuthorView) });
  } catch (err) {
    res.status(500).json({ message: "Failed to list tickets" });
  }
}

export async function getTicket(req, res, next) {
  try {

    const ticket = await findTicketForUser(req);

    res.json({ ticket: isAdmin(req) ? ticket : toAuthorView(ticket) });

  } catch (err) {
    res.status(404).json({ message: "Ticket not found" });
  }
}

// Admin: change status / category / priority / assignment
export async function updateTicket(req, res, next) {
  try {

    const ticket = await findTicketForUser(req);
    const { status, category, priority, assignedTo } = req.body;

    if (status) ticket.status = status;

    if (category && category !== ticket.category) {
      ticket.category = category;
      ticket.categorySource = "admin";
      ticket.aiDraft = ""; // draft was written for the old category, so throw it away
    }

    if (priority && priority !== ticket.priority) {
      ticket.priority = priority;
      ticket.prioritySource = "admin";
    }

    if (assignedTo === "me") ticket.assignedTo = req.user.id;
    if (assignedTo === null) ticket.assignedTo = null;

    await ticket.save();

    await ticket.populate("assignedTo", "name");

    res.json({ ticket });

  } catch (err) {
    res.status(500).json({ message: "Failed to update ticket" });
  }
}

// Admin: send a reply to the author
export async function addResponse(req, res, next) {
  try {
    const ticket = await findTicketForUser(req);

    const { message, markResolved } = req.body;

    ticket.responses.push({ sender: "admin", senderName: req.user.name, message });

    ticket.status = markResolved ? "Resolved" : "In Progress";

    if (!ticket.assignedTo) ticket.assignedTo = req.user.id;

    ticket.aiDraft = ""; // the draft has been used

    await ticket.save();

    await ticket.populate("assignedTo", "name");

    res.status(201).json({ ticket });

  } catch (err) {
    res.status(500).json({ message: "Failed to add response" });
  }
}

// Admin: internal note, hidden from the author
export async function addNote(req, res, next) {
  try {

    const ticket = await findTicketForUser(req);

    ticket.internalNotes.push({ admin: req.user.id, adminName: req.user.name, note: req.body.note });

    await ticket.save();

    res.status(201).json({ ticket });
  } catch (err) {
    res.status(500).json({ message: "Failed to add note" });
  }
}

// Admin: get (or regenerate) the AI draft. A cached draft is returned unless regenerate is true.
export async function getAiDraft(req, res, next) {
  try {

    const ticket = await findTicketForUser(req);

    const regenerate = req.body.regenerate === true;

    if (ticket.aiDraft && !regenerate) {
      return res.json({ draft: ticket.aiDraft, cached: true });
    }

    const author = await User.findById(ticket.author._id);

    const book = ticket.book ? await Book.findById(ticket.book._id) : null;

    // if the AI is down this throws a 503 and the admin can still write by hand
    const draft = await draftResponse({ ticket, author, book });

    ticket.aiDraft = draft;

    ticket.aiDraftAt = new Date();

    await ticket.save();

    res.json({ draft, cached: false });
    
  } catch (err) {
     res.status(503).json({ message: "AI service is unavailable, please try again later" });  
  }
}
