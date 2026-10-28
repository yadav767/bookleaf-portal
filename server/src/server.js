import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing. Add it to your .env file.");
  }
  await connectDB();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
