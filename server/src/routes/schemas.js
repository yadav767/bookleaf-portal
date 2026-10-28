import { z } from "zod";
import { CATEGORIES, PRIORITIES, STATUSES } from "../utils/constants.js";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const createTicketSchema = z.object({
  bookId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid book id").nullish().transform((v) => v || null),
  subject: z.string().trim().min(3, "Subject is too short").max(150, "Subject is too long"),
  description: z.string().trim().min(10, "Please describe your query in a bit more detail").max(5000),
  attachmentName: z.string().trim().max(200).optional(),
});

export const updateTicketSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    category: z.enum(CATEGORIES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    assignedTo: z.union([z.literal("me"), z.null()]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const responseSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(5000),
  markResolved: z.boolean().optional(),
});

export const noteSchema = z.object({
  note: z.string().trim().min(1, "Note cannot be empty").max(2000),
});

export const draftSchema = z.object({
  regenerate: z.boolean().optional(),
});
