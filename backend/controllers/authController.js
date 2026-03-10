const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generateToken = require("../utils/generateToken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// helper function to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
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

    if (existingUser && !existingUser.isVerified) {
      return res.status(400).json({
        message: "OTP already sent. Please verify or resend OTP.",
      });
    }


    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false,
    });

    // Send OTP via Email
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "LifeLink - Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">LifeLink Email Verification</h2>
          <p>Hello,</p>
          <p>Thank you for registering with LifeLink. Please use the following One-Time Password (OTP) to verify your email address and complete your registration.</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</span>
          </div>
          <p>This OTP is valid for 10 minutes. If you did not request this verification, please ignore this email.</p>
          <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions).catch((err) => {
      console.error("Failed to send registration OTP email:", err);
    });

    res.status(201).json({
      message: "User registered successfully. Verify OTP.",
      userId: user._id,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: "UserId and OTP are required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

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

    // Send Registration Success Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Welcome to LifeLink! Registration Successful",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">Welcome to LifeLink!</h2>
          <p>Dear User,</p>
          <p>Congratulations! Your email has been successfully verified and your registration is complete.</p>
          <p>Thank you for joining our noble cause. Your participation in LifeLink can help save lives by connecting blood donors with those in need. Every drop counts!</p>
          <p>You can now log in to your account and complete your profile, request blood, or register as a donor.</p>
          <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
        </div>
      `,
    };

    // Send email asynchronously (don't block the response)
    transporter.sendMail(mailOptions).catch((err) => {
      console.error("Failed to send welcome email:", err);
    });

    res.status(200).json({
      message: "OTP verified successfully. You can now login.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify OTP before login" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    // ✅ Check profile completion
    const profile = user.profile || {};

    const profileCompleted =
      profile.name &&
      profile.phone &&
      profile.bloodGroup &&
      profile.gender &&
      profile.dob &&
      profile.address &&
      profile.pincode;

    res.status(200).json({
      message: "Login successful",
      token,
      profileCompleted: !!profileCompleted,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "UserId is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // Generate new 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP via Email
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "LifeLink - Resend verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">LifeLink Email Verification</h2>
          <p>Hello,</p>
          <p>You have requested a new One-Time Password (OTP) to verify your email address. Please use the following OTP:</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</span>
          </div>
          <p>This OTP is valid for 10 minutes. If you did not request this verification, please ignore this email.</p>
          <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions).catch((err) => {
      console.error("Failed to resend registration OTP email:", err);
    });

    res.status(200).json({
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { tokenId, mode } = req.body;

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, sub: googleId, name } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (mode === "register") {
      if (user) {
        return res.status(400).json({ message: "User already exists. Please login." });
      }

      // Create new verified user
      user = await User.create({
        email,
        googleId,
        isVerified: true,
        profile: {
          name: name,
        },
      });

      // Send Registration Success Email
      const transporter = require("nodemailer").createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Welcome to LifeLink! Registration Successful",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d9534f;">Welcome to LifeLink!</h2>
            <p>Dear ${name},</p>
            <p>Congratulations! Your Google account has been successfully linked and your registration is complete.</p>
            <p>Thank you for joining our noble cause. Your participation in LifeLink can help save lives by connecting blood donors with those in need. Every drop counts!</p>
            <p>You can now go to your dashboard, request blood, or register as a donor.</p>
            <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
          </div>
        `,
      };

      transporter.sendMail(mailOptions).catch((err) => {
        console.error("Failed to send welcome email:", err);
      });

      return res.status(201).json({
        message: "Registration successful. Please login to continue.",
      });
    }

    // Default or explicit 'login' mode
    if (!user) {
      // ✅ Automatically register if user not found during login
      user = await User.create({
        email,
        googleId,
        isVerified: true,
        profile: {
          name: name,
        },
      });

      // Send Registration Success Email
      const transporter = require("nodemailer").createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Welcome to LifeLink! Registration Successful",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d9534f;">Welcome to LifeLink!</h2>
            <p>Dear ${name},</p>
            <p>Congratulations! Your Google account has been successfully linked and your registration is complete.</p>
            <p>Thank you for joining our noble cause. Your participation in LifeLink can help save lives by connecting blood donors with those in need. Every drop counts!</p>
            <p>You can now go to your dashboard, request blood, or register as a donor.</p>
            <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
          </div>
        `,
      };

      transporter.sendMail(mailOptions).catch((err) => {
        console.error("Failed to send welcome email:", err);
      });
    }

    // If user exists but hasn't linked Google
    if (!user.googleId) {
      user.googleId = googleId;
      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user._id);

    // Check profile completion
    const profile = user.profile || {};
    const profileCompleted =
      profile.name &&
      profile.phone &&
      profile.bloodGroup &&
      profile.gender &&
      profile.dob &&
      profile.address &&
      profile.pincode;

    res.status(200).json({
      message: "Google Login successful",
      token,
      profileCompleted: !!profileCompleted,
      user: {
        id: user._id,
        email: user.email,
        name: profile.name,
      },
    });
  } catch (error) {
    console.error("Google verify error:", error);
    res.status(400).json({ message: "Invalid Google Token" });
  }
};

const nodemailer = require("nodemailer");

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "LifeLink - Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear OTP
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
