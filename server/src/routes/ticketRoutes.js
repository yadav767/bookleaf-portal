import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  addNote,
  addResponse,
  createTicket,
  getAiDraft,
  getTicket,
  listTickets,
  updateTicket,
} from "../controllers/ticketController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  createTicketSchema,
  draftSchema,
  noteSchema,
  responseSchema,
  updateTicketSchema,
} from "./schemas.js";

const router = Router();
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many AI requests, slow down a little" },
});

router.use(requireAuth);

router.post("/", requireRole("author"), validate(createTicketSchema), createTicket);
router.get("/", listTickets);
router.get("/:id", getTicket);

router.patch("/:id", requireRole("admin"), validate(updateTicketSchema), updateTicket);
router.post("/:id/responses", requireRole("admin"), validate(responseSchema), addResponse);
router.post("/:id/notes", requireRole("admin"), validate(noteSchema), addNote);
router.post("/:id/ai-draft", requireRole("admin"), aiLimiter, validate(draftSchema), getAiDraft);

export default router;
