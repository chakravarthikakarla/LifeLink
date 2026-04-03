const express = require("express");
const router = express.Router();

const {
  register,
  verifyOtp,
  login,
  googleAuth,
  resendOtp,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

const rateLimit = require("express-rate-limit");

// General auth rate limiter (e.g., max 10 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth routes
router.post("/register", authLimiter, register);
router.post("/verify-otp", authLimiter, verifyOtp);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleAuth);
router.post("/resend-otp", authLimiter, resendOtp);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

module.exports = router;