import mongoose from "mongoose";
import { CATEGORIES, PRIORITIES, PRIORITY_RANK, STATUSES } from "../utils/constants.js";

const responseSchema = new mongoose.Schema(
  {
    sender: { 
      type: String, 
      enum: ["admin", "author"], 
      required: true 
    },

    senderName: String,

    message: { 
      type: String, 
      required: true 
    },

  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const noteSchema = new mongoose.Schema(
  {
    admin: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },

    adminName: String,

    note: { 
      type: String, 
      required: true 
    },

  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ticketSchema = new mongoose.Schema(
  {
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },

    book: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Book", 
      default: null 
    },

    subject: { 
      type: String, 
      required: true, 
      trim: true 
    },

    description: { 
      type: String, 
      required: true, 
      trim: true 
    },

    attachmentName: String, 

    status: { 
      type: String, 
      enum: STATUSES, 
      default: "Open", 
      index: true 
    },

    category: { 
      type: String, 
      enum: CATEGORIES, 
      default: "General Inquiry", 
      index: true 
    },


    categorySource: { 
      type: String, 
      enum: ["pending", "ai", "rules", "admin"], 
      default: "pending" 
    },

    priority: { 
      type: String, 
      enum: PRIORITIES, 
      default: "Medium" 
    },

    priorityRank: { 
      type: Number, 
      default: PRIORITY_RANK.Medium, 
      index: true 
    },

    prioritySource: { 
      type: String, 
      enum: ["pending", "ai", "rules", "admin"], 
      default: "pending" 
    },

    aiReason: String, 

    assignedTo: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      default: null 
    },

    responses: [responseSchema],

    internalNotes: [noteSchema],


    aiDraft: { type: String, default: "" },

    aiDraftAt: Date,
  },
  { timestamps: true }
);


ticketSchema.pre("save", function (next) {
  if (this.isModified("priority")) {
    this.priorityRank = PRIORITY_RANK[this.priority];
  }
  next();
});

export default mongoose.model("Ticket", ticketSchema);
