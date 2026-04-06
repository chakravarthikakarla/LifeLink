const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getPendingAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
  getAllClubs,
  getClubMembers,
  getUserProfile,
  getDashboardStats,
  getUsersWithoutClub
} = require("../controllers/adminController");

const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL || "debateverse80@gmail.com";

// Protective middleware (Master Admin Only)
const masterAdminOnly = (req, res, next) => {
  if (req.user && req.user.email === MASTER_ADMIN_EMAIL) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Master Admin ONLY." });
  }
};

router.use(authMiddleware);
router.use(masterAdminOnly);

// routes
router.get("/pending-requests", getPendingAdminRequests);
router.put("/approve/:userId", approveAdminRequest);
router.put("/reject/:userId", rejectAdminRequest);
router.get("/clubs", getAllClubs);
router.get("/club/:clubName/members", getClubMembers);
router.get("/user/:userId/profile", getUserProfile);
router.get("/dashboard-stats", getDashboardStats);
router.get("/users-without-club", getUsersWithoutClub);

module.exports = router;
