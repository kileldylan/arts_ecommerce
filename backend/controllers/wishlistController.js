import db from "../config/db.js";

// Add to wishlist
export const addToWishlist = async (req, res) => {
  const userId = req.user.id; // from auth middleware
  const { productId } = req.body;

  try {
    await db.query(
      "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP",
      [userId, productId]
    );
    res.status(200).json({ message: "Product added to wishlist" });
  } catch (err) {
    console.error("Add to wishlist error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  try {
    await db.query(
      "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );
    res.status(200).json({ message: "Product removed from wishlist" });
  } catch (err) {
    console.error("Remove wishlist error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all wishlist products
export const getWishlist = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT p.* 
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?`,
      [userId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get wishlist error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
