const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL || "debateverse80@gmail.com";

// Get all users who have requested admin role but are not yet approved
const getPendingAdminRequests = async (req, res) => {
  try {
    // Only master admin can access this
    if (req.user.email !== MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: "Access denied. Only Master Admin can view requests." });
    }

    const pendingAdmins = await User.find({
      "profile.clubRole": "admin",
      "profile.isAdminApproved": false,
      email: { $ne: MASTER_ADMIN_EMAIL }
    }).select("email profile");

    res.status(200).json(pendingAdmins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve an admin request
const approveAdminRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.email !== MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: "Access denied." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profile.isAdminApproved = true;
    await user.save();

    // Send notification email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:auto; border:1px solid #eee; padding:20px; border-radius:10px;">
        <h2 style="color:#6a0026; text-align:center;">Admin Request Approved!</h2>
        <p>Dear ${user.profile?.name || "User"},</p>
        <p>We are pleased to inform you that your request to become a <strong>Club Admin</strong> for <strong>${user.profile?.club}</strong> on LifeLink has been <strong>approved</strong> by the Master Admin.</p>
        <p>You now have access to the Admin Dashboard where you can manage club members and view donation records.</p>
        <div style="text-align:center; margin:30px 0;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" style="background:#6a0026; color:#fff; text-decoration:none; padding:12px 25px; border-radius:5px; font-weight:bold;">Login to Dashboard</a>
        </div>
        <p>Thank you for your commitment to saving lives.</p>
        <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
      </div>
    `;

    await sendEmail(user.email, "LifeLink - Admin Request Approved", emailHtml);

    res.status(200).json({ message: "Admin request approved and user notified." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject an admin request
const rejectAdminRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.email !== MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: "Access denied." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Reset role to member
    user.profile.clubRole = "member";
    user.profile.isAdminApproved = false;
    await user.save();

    // Send notification email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:auto; border:1px solid #eee; padding:20px; border-radius:10px;">
        <h2 style="color:#d9534f; text-align:center;">Admin Request Status</h2>
        <p>Dear ${user.profile?.name || "User"},</p>
        <p>Thank you for your interest in becoming a Club Admin for LifeLink.</p>
        <p>After careful review, we regret to inform you that your request to become an admin for <strong>${user.profile?.club}</strong> has been <strong>rejected</strong> at this time.</p>
        <p>However, you can still participate as a <strong>Member</strong> and continue to help our community by donating blood and responding to requests.</p>
        <p>If you believe this was a mistake or have any questions, please contact us.</p>
        <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
      </div>
    `;

    await sendEmail(user.email, "LifeLink - Admin Request Status", emailHtml);

    res.status(200).json({ message: "Admin request rejected and user notified." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all clubs
const getAllClubs = async (req, res) => {
  try {
    if (req.user.email !== MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: "Access denied." });
    }

    const clubs = ["NSS", "NCC", "Redcross"];
    
    const clubStats = await Promise.all(
      clubs.map(async (club) => {
        const memberCount = await User.countDocuments({
          "profile.club": club,
          email: { $ne: MASTER_ADMIN_EMAIL }
        });
        
        const adminCount = await User.countDocuments({
          "profile.club": club,
          "profile.clubRole": "admin",
          "profile.isAdminApproved": true,
          email: { $ne: MASTER_ADMIN_EMAIL }
        });

        return {
          name: club,
          memberCount,
          adminCount
        };
      })
    );

    res.status(200).json(clubStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get members of a specific club
const getClubMembers = async (req, res) => {
  try {
    const { clubName } = req.params;

    if (req.user.email !== MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: "Access denied." });
    }

    const validClubs = ["NSS", "NCC", "Redcross"];
    if (!validClubs.includes(clubName)) {
      return res.status(400).json({ message: "Invalid club name" });
    }

    const members = await User.find({
      "profile.club": clubName,
      email: { $ne: MASTER_ADMIN_EMAIL }
    }).select("_id email profile");

    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile (Master Admin only)
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.email !== MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: "Access denied." });
    }

    const user = await User.findById(userId).select("-password -otp -otpExpiry");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    if (req.user.email !== MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: "Access denied." });
    }

    const totalUsers = await User.countDocuments({
      email: { $ne: MASTER_ADMIN_EMAIL }
    });

    const pendingAdmins = await User.countDocuments({
      "profile.clubRole": "admin",
      "profile.isAdminApproved": false,
      email: { $ne: MASTER_ADMIN_EMAIL }
    });

    const approvedAdmins = await User.countDocuments({
      "profile.clubRole": "admin",
      "profile.isAdminApproved": true,
      email: { $ne: MASTER_ADMIN_EMAIL }
    });

    const clubStats = await Promise.all(
      ["NSS", "NCC", "Redcross"].map(async (club) => {
        const count = await User.countDocuments({
          "profile.club": club,
          email: { $ne: MASTER_ADMIN_EMAIL }
        });
        return { club, count };
      })
    );

    const usersWithoutClub = await User.countDocuments({
      "profile.club": "none",
      email: { $ne: MASTER_ADMIN_EMAIL }
    });

    res.status(200).json({
      totalUsers,
      pendingAdmins,
      approvedAdmins,
      clubDistribution: clubStats,
      usersWithoutClub
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users without any club
const getUsersWithoutClub = async (req, res) => {
  try {
    if (req.user.email !== MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ message: "Access denied." });
    }

    const users = await User.find({
      "profile.club": "none",
      email: { $ne: MASTER_ADMIN_EMAIL }
    }).select("_id email profile");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
  getAllClubs,
  getClubMembers,
  getUserProfile,
  getDashboardStats,
  getUsersWithoutClub
};
