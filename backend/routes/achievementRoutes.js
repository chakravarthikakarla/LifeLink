const express = require("express");
const router = express.Router();
const { getLeaderboard, getUserAchievements } = require("../controllers/achievementController");
const authMiddleware = require("../middleware/authMiddleware");

// @desc    Get Club Leaderboard
// @route   GET /api/achievements/leaderboard
router.get("/leaderboard", getLeaderboard);

// @desc    Get User Achievements & Stats
// @route   GET /api/achievements/stats
router.get("/stats", authMiddleware, getUserAchievements);

module.exports = router;
