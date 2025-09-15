import express from "express";
import { addToWishlist, removeFromWishlist, getWishlist } from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, addToWishlist);
router.post("/remove", protect, removeFromWishlist);
router.get("/", protect, getWishlist);

export default router;
