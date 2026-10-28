import Book from "../models/Book.js";

// Authors get their own books, admins get everything
export async function listBooks(req, res, next) {
  try {
    const filter = req.user.role === "admin" ? {} : { owner: req.user.id };

    const books = await Book.find(filter)
      .populate("owner", "name email")
      .sort({ createdAt: 1 });

    res.json({ books });
    
  } catch (err) {
    res.status(500).json({ message: "Failed to list books" });
  }
}
