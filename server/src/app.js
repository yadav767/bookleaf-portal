import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
