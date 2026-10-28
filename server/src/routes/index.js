import { Router } from "express";
import authRoutes from "./authRoutes.js";
import bookRoutes from "./bookRoutes.js";
import ticketRoutes from "./ticketRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/books", bookRoutes);
router.use("/tickets", ticketRoutes);

export default router;
