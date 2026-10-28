import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },

    bookId: { 
      type: String, 
      required: true, 
      unique: true 
    }, 

    title: { 
      type: String, 
      required: true 
    },

    isbn: String,

    genre: String,

    publicationDate: Date, 

    status: { 
      type: String, 
      required: true 
    },

    mrp: Number,

    royaltyPerCopy: Number,

    totalCopiesSold: { 
      type: Number, 
      default: 0 
    },

    totalRoyaltyEarned: { 
      type: Number, 
      default: 0 
    },

    royaltyPaid: { 
      type: Number, 
      default: 0 
    },

    royaltyPending: { 
      type: Number, 
      default: 0 
    },

    lastRoyaltyPayoutDate: Date,

    printPartner: String,

    availableOn: [String],
    
  },
  { timestamps: true }
);

// handy flag used by the UI and the AI prompt
bookSchema.virtual("isInProduction").get(function () {
  return this.status.startsWith("In Production");
});

export default mongoose.model("Book", bookSchema);
