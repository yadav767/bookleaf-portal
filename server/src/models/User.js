import mongoose from "mongoose";
import { ROLES } from "../utils/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },

    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },

    password: { 
      type: String, 
      required: true, 
      select: false 
    },

    role: { 
      type: String, 
      enum: Object.values(ROLES), 
      default: ROLES.AUTHOR 
    },

    authorId: { 
      type: String 
    },

    phone: { 
      type: String 
    },

    city: { 
      type: String 
    },

    joinedDate: { 
      type: Date 
    },
    
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
