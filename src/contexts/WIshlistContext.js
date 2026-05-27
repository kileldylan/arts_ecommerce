// src/contexts/WishlistContext.js
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data } = await axios.get("/api/wishlist", { withCredentials: true });
      setWishlist(data);
    } catch (err) {
      console.error("Fetch wishlist error:", err);
    }
  };

  const toggleWishlist = async (product) => {
    const isWishlisted = wishlist.some((p) => p.id === product.id);

    try {
      if (isWishlisted) {
        // remove from wishlist
        await axios.post("/api/wishlist/remove", { productId: product.id }, { withCredentials: true });
        setWishlist((prev) => prev.filter((p) => p.id !== product.id));
      } else {
        // add to wishlist
        await axios.post("/api/wishlist/add", { productId: product.id }, { withCredentials: true });
        setWishlist((prev) => [...prev, product]); // optimistically update UI
      }
    } catch (err) {
      console.error("Toggle wishlist error:", err);
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
