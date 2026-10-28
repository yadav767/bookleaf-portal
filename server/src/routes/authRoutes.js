import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { loginSchema } from "./schemas.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many login attempts, try again later" },
});

router.post("/login", loginLimiter, validate(loginSchema), login);
router.get("/me", requireAuth, me);

export default router;
