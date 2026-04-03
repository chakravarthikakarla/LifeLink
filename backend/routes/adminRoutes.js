const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getPendingAdminRequests,
  approveAdminRequest,
  rejectAdminRequest
} = require("../controllers/adminController");

// Protective middleware (Master Admin Only)
const masterAdminOnly = (req, res, next) => {
  if (req.user && req.user.email === "admin@lifelink.com") {
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

module.exports = router;
