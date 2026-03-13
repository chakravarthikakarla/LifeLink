const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const generateToken = require("../utils/generateToken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  try {
    await sendEmail(
      email,
      "Welcome to LifeLink! Registration Successful",
      `
      <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:auto;">
        <h2 style="color:#d9534f;">Welcome to LifeLink!</h2>

        <p>Dear ${name || "User"},</p>

        <p>
        Congratulations! Your account has been successfully verified and your registration is complete.
        </p>

        <p>
        Thank you for joining our noble cause. Your participation in LifeLink can help save lives by
        connecting blood donors with those in need. Every drop counts!
        </p>

        <p>
        You can now log in to your account and complete your profile, request blood,
        or register as a donor.
        </p>

        <br/>

        <p>
        Best regards,<br/>
        <strong>The LifeLink Team</strong>
        </p>
      </div>
      `
    );
  } catch (err) {
    console.log("Welcome email failed:", err.message);
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let user;

    if (existingUser && !existingUser.isVerified) {
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      existingUser.password = await bcrypt.hash(password, 10);
      user = await existingUser.save();
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        email,
        password: hashedPassword,
        otp,
        otpExpiry,
        isVerified: false
      });
    }

    await sendEmail(
      email,
      "LifeLink - Verify Your Email",
      `
      <h2>LifeLink Email Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
      `
    );

    res.status(201).json({
      message: "User registered. Verify OTP.",
      userId: user._id
    });

  } catch (error) {
    console.log("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {

    const { userId, otp } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    await sendWelcomeEmail(user.email, user.profile?.name);

    res.status(200).json({
      message: "OTP verified successfully. You can now login."
    });

  } catch (error) {
    console.log("Verify OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Verify OTP first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resendOtp = async (req, res) => {
  try {

    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;

    await user.save();

    await sendEmail(
      user.email,
      "LifeLink - Resend OTP",
      `<h2>Your OTP is: ${otp}</h2>`
    );

    res.status(200).json({
      message: "OTP resent successfully"
    });

  } catch (error) {
    console.log("Resend OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;

    await user.save();

    await sendEmail(
      email,
      "LifeLink - Password Reset OTP",
      `<h2>Your OTP: ${otp}</h2><p>Valid for 10 minutes</p>`
    );

    res.status(200).json({
      message: "OTP sent to your email"
    });

  } catch (error) {
    console.log("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {

    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.status(200).json({
      message: "Password reset successful"
    });

  } catch (error) {
    console.log("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};