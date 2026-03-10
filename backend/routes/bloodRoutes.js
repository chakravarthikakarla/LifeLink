const express = require("express");
const router = express.Router();

const { createBloodRequest, getMyRequests, closeBloodRequest, getAllActiveRequests, getRequestById, getUnreadAlertCount, markAlertsAsViewed } = require("../controllers/bloodController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/request", authMiddleware, createBloodRequest);
router.get("/my-requests", authMiddleware, getMyRequests);
router.post("/close", authMiddleware, closeBloodRequest);
router.get("/all", authMiddleware, getAllActiveRequests);
router.get("/request/:id", authMiddleware, getRequestById);
router.get("/unread-count", authMiddleware, getUnreadAlertCount);
router.post("/mark-viewed", authMiddleware, markAlertsAsViewed);

module.exports = router;
