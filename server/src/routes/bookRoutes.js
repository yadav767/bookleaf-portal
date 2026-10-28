import { Router } from "express";
import { listBooks } from "../controllers/bookController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listBooks);

export default router;
