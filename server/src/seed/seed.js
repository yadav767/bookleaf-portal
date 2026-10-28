import "dotenv/config";
import fs from "fs";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Book from "../models/Book.js";
import Ticket from "../models/Ticket.js";

const AUTHOR_PASSWORD = "author123";
const ADMIN_EMAIL = "admin@bookleaf.com";
const ADMIN_PASSWORD = "admin123";

const data = JSON.parse(fs.readFileSync(new URL("./data.json", import.meta.url), "utf-8"));

async function seed() {
  await connectDB();

  // start clean so the seed can be run more than once
  await Promise.all([User.deleteMany({}), Book.deleteMany({}), Ticket.deleteMany({})]);

  const authorHash = await bcrypt.hash(AUTHOR_PASSWORD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await User.create({ name: "BookLeaf Support", email: ADMIN_EMAIL, password: adminHash, role: "admin" });

  let bookCount = 0;
  for (const a of data.authors) {
    const user = await User.create({
      name: a.name,
      email: a.email,
      password: authorHash,
      role: "author",
      authorId: a.author_id,
      phone: a.phone,
      city: a.city,
      joinedDate: a.joined_date,
    });

    const books = a.books.map((b) => ({
      owner: user._id,
      bookId: b.book_id,
      title: b.title,
      isbn: b.isbn,
      genre: b.genre,
      publicationDate: b.publication_date,
      status: b.status,
      mrp: b.mrp,
      royaltyPerCopy: b.author_royalty_per_copy,
      totalCopiesSold: b.total_copies_sold,
      totalRoyaltyEarned: b.total_royalty_earned,
      royaltyPaid: b.royalty_paid,
      royaltyPending: b.royalty_pending,
      lastRoyaltyPayoutDate: b.last_royalty_payout_date,
      printPartner: b.print_partner,
      availableOn: b.available_on,
    }));
    await Book.insertMany(books);
    bookCount += books.length;
  }

  console.log(`Seeded ${data.authors.length} authors and ${bookCount} books`);
  console.log(`Admin login:  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Author login: <any author email from the dataset> / ${AUTHOR_PASSWORD}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
