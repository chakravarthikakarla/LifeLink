const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const sendForgotEmail = require("../utils/sendForgotEmail");
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
    const loginLink = `${(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "")}/login`;

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
        A special vote of thanks for joining our noble cause. Your participation in LifeLink can help save lives by
        connecting blood donors with those in need. Every drop counts!
        </p>

        <div style="background:#f8f9fa; padding:14px; border-radius:6px; margin:16px 0;">
          <p style="margin:0 0 8px 0;"><strong>Your login credentials:</strong></p>
          <p style="margin:0;"><strong>Email:</strong> ${email}</p>
          <p style="margin:8px 0 0 0;"><strong>Password:</strong> The password you created during registration</p>
        </div>

        <p>
        Please log in with the above credentials and add your profile details (name, phone, blood group, address, etc.)
        to activate all features.
        </p>

        <p>
        Once your details are completed, you can request blood, respond to alerts, and register as an active donor.
        </p>

        <div style="text-align:center; margin:24px 0;">
          <a href="${loginLink}" style="background:#d9534f; color:#fff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:600; display:inline-block;">
            Login to LifeLink
          </a>
        </div>

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

    const otpSent = await sendEmail(
      email,
      "LifeLink - Email Verification OTP",
      `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
          <h2 style="color:#d9534f;">Email Verification OTP</h2>
          <p>Your OTP for email verification is:</p>
          <h1 style="letter-spacing:8px;color:#d9534f;text-align:center;">${otp}</h1>
          <p style="color:#888;">Valid for <strong>10 minutes</strong>. Do not share with anyone.</p>
          <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
        </div>
      `
    );

    if (!otpSent?.ok) {
      return res.status(502).json({
        message: `Unable to send verification email (${otpSent?.error?.code || "SMTP_ERROR"}). Check SMTP configuration on the server.`,
      });
    }

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
      profileCompleted: user.profileCompleted,
      user: {
        id: user._id,
        email: user.email,
        profileCompleted: user.profileCompleted,
        profile: user.profile
      }
    });

  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Google Sign-in (OAuth)
exports.googleAuth = async (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ message: "Google token is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const name = payload?.name;
    const picture = payload?.picture;
    const googleId = payload?.sub;

    if (!email) {
      return res.status(400).json({ message: "Google login failed" });
    }

    let user = await User.findOne({ email });

    if (user) {
      // Attach googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true;
        await user.save();
      }
    } else {
      user = await User.create({
        email,
        googleId,
        isVerified: true,
        profile: {
          name,
          photo: picture,
        },
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successful",
      token,
      profileCompleted: user.profileCompleted,
      user: {
        id: user._id,
        email: user.email,
        profileCompleted: user.profileCompleted,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.log("Google login error:", error);
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

    const resendSent = await sendEmail(
      user.email,
      "LifeLink - Email Verification OTP",
      `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;">
          <h2 style="color:#d9534f;">Email Verification OTP</h2>
          <p>Your OTP for email verification is:</p>
          <h1 style="letter-spacing:8px;color:#d9534f;text-align:center;">${otp}</h1>
          <p style="color:#888;">Valid for <strong>10 minutes</strong>. Do not share with anyone.</p>
          <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
        </div>
      `
    );

    if (!resendSent?.ok) {
      return res.status(502).json({
        message: `Unable to resend OTP email (${resendSent?.error?.code || "SMTP_ERROR"}). Check SMTP configuration on the server.`,
      });
    }

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

    const forgotSent = await sendForgotEmail(email, otp);

    if (!forgotSent?.ok) {
      return res.status(502).json({
        message: `Unable to send password reset email (${forgotSent?.error?.code || "SMTP_ERROR"}). Check SMTP configuration on the server.`,
      });
    }

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