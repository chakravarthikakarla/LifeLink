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

// Auth routes
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;