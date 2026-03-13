const express = require("express");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/unread-count", authMiddleware, chatController.getUnreadCount);
router.post("/mark-as-read", authMiddleware, chatController.markAsRead);
router.get("/:requestId/:targetUserId", authMiddleware, chatController.getChatHistory);

module.exports = router;
