// src/pages/customer/WishlistPage.js
import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import { useWishlist } from "../../contexts/WIshlistContext";
import Navbar from "../../components/NavBar";

export default function WishlistPage() {
  const { wishlist } = useWishlist();

  return (
    <>
      <Navbar />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700} mb={3}>
          My Wishlist
        </Typography>

        {wishlist.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            Your wishlist is empty.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {wishlist.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Box
                  sx={{
                    border: "1px solid #eee",
                    borderRadius: 2,
                    p: 2,
                    textAlign: "center",
                  }}
                >
                  <img
                    src={product.images ? product.images[0] : "/api/placeholder/150/150"}
                    alt={product.name}
                    style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }}
                  />
                  <Typography variant="subtitle1" mt={1} fontWeight={600}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ksh{parseFloat(product.price).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </>
  );
}
