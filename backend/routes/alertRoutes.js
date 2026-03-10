const express = require("express");
const router = express.Router();

const {
  getAlerts,
  acceptAlert,
  rejectAlert,
} = require("../controllers/alertController");

const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getAlerts);
router.post("/accept", authMiddleware, acceptAlert);
router.post("/reject", authMiddleware, rejectAlert);

module.exports = router;