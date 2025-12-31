import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import "../passportSetup.js";

const router = express.Router();

// Generate JWT token function
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/api/auth/failure" }),
  (req, res) => {
    // Generate JWT token for the authenticated user
    const token = generateToken(req.user);
    
    // Redirect to frontend with token and user data
    res.redirect(`${process.env.FRONT_END_URL}/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

// GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/api/auth/failure" }),
  (req, res) => {
    // Generate JWT token for the authenticated user
    const token = generateToken(req.user);
    
    // Redirect to frontend with token and user data
    res.redirect(`${process.env.FRONT_END_URL}/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

// OAuth success page (for frontend to handle the token)
router.get("/success", (req, res) => {
  res.json({ message: "OAuth successful" });
});

// OAuth failure page
router.get("/failure", (req, res) => {
  res.json({ error: "OAuth failed" });
});

export default router;