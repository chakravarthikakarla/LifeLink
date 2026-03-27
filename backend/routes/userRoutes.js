const express = require("express");
const router = express.Router();

const {
  getUserProfile,
  updateUserProfile,
  getClubMembers,
  getMemberProfile,
  removeMember,
  getClubDonations
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");

router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile", authMiddleware, updateUserProfile);
router.get("/club-members", authMiddleware, getClubMembers);
router.get("/member-profile/:id", authMiddleware, getMemberProfile);
router.put("/remove-member/:id", authMiddleware, removeMember);
router.get("/club-donations", authMiddleware, getClubDonations);

module.exports = router;
