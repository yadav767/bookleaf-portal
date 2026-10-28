import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

function signToken(user) {
  return jwt.sign({
    id: user._id,
    role: user.role,
    name: user.name
  },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");


    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    };

    res.json({
      token: signToken(user),
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to log in" });
  }
}

export async function me(req, res, next) {
  try {

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    };
    res.json({ 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (err) {
    res.status
  }
}
