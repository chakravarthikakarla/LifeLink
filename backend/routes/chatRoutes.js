const express = require("express");
const { getChatHistory, getUnreadCount } = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/unread", authMiddleware, getUnreadCount);
router.get("/:requestId/:targetUserId", authMiddleware, getChatHistory);

module.exports = router;
