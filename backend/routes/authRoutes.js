const express = require("express");
const router = express.Router();



const { register, verifyOtp, login, resendOtp, googleLogin, forgotPassword, resetPassword } =
  require("../controllers/authController");


const authMiddleware = require("../middleware/authMiddleware");

// Auth routes
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/resend-otp", resendOtp);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


module.exports = router;
