const mongoose = require("mongoose");
const Alert = require("../models/Alert");
const BloodRequest = require("../models/BloodRequest");
const Message = require("../models/Message");

// 🔔 Get alerts globally for logged-in user
const getAlerts = async (req, res) => {
  try {
    // Auto-close requests older than 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Find active requests that are about to be auto-closed
    const soonToBeClosed = await BloodRequest.find({
      status: "active",
      createdAt: { $lt: threeDaysAgo }
    });

    if (soonToBeClosed.length > 0) {
      const ids = soonToBeClosed.map(r => r._id);
      
      // Update requests
      await BloodRequest.updateMany(
        { _id: { $in: ids } },
        { $set: { status: "closed", closedAt: new Date() } }
      );

      // Update associated Alerts to ensure they stay visible for 24h from now
      await Alert.updateMany(
        { bloodRequest: { $in: ids } },
        { $set: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } }
      );

      // Notify users
      const io = req.app.get("io");
      if (io) {
        io.emit("notification_update", { type: "alert" });
      }
    }

    let alerts = await Alert.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("bloodRequest")
      .sort({ createdAt: -1 });

    // Include active requests OR closed requests that were closed within the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const currentUserId = req.user._id.toString();

    alerts = alerts.filter((alert) => {
      if (!alert.bloodRequest) return false;
      
      // 🚫 Exclude requester from seeing their own alerts
      const requesterId = (alert.bloodRequest.requester?._id || alert.bloodRequest.requester)?.toString();
      if (requesterId === currentUserId) return false;

      if (alert.bloodRequest.status === "active") return true;
      if (alert.bloodRequest.status === "closed") {
        const closedTime = alert.bloodRequest.closedAt || alert.bloodRequest.updatedAt;
        return new Date(closedTime) > oneDayAgo;
      }
      return false;
    });

    // Attach current user's ID and calculate unread counts
    const alertsWithUserId = await Promise.all(
      alerts.map(async (alert) => {
        const obj = alert.toObject();
        obj._myId = req.user._id.toString();

        // If user has accepted, check for unread messages from the requester
        const accepted = alert.acceptedDonors.some(
          (d) => d.user.toString() === obj._myId
        );

        if (accepted && obj.bloodRequest?.requester) {
          obj.unreadCount = await Message.countDocuments({
            bloodRequest: new mongoose.Types.ObjectId(obj.bloodRequest._id),
            sender: new mongoose.Types.ObjectId(obj.bloodRequest.requester),
            receiver: new mongoose.Types.ObjectId(req.user._id),
            isRead: false,
          });
        } else {
          obj.unreadCount = 0;
        }

        return obj;
      })
    );

    res.status(200).json(alertsWithUserId);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Accept alert (per user, with timestamp)
const acceptAlert = async (req, res) => {
  try {
    const { alertId } = req.body;

    const alert = await Alert.findById(alertId).populate("bloodRequest");

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    // Do not allow accept if request closed
    if (alert.bloodRequest.status === "closed") {
      return res.status(400).json({ message: "Request already completed" });
    }

    // Check if already accepted
    const alreadyAccepted = alert.acceptedDonors.some(
      (d) => d.user.toString() === req.user._id.toString()
    );
    if (alreadyAccepted) {
      return res.status(400).json({ message: "You have already accepted this request" });
    }

    // Check if already rejected (choice is locked)
    const alreadyRejected = alert.rejectedDonors.some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (alreadyRejected) {
      return res.status(400).json({ message: "You have already rejected this request" });
    }

    alert.acceptedDonors.push({
      user: req.user._id,
      acceptedAt: new Date(),
    });

    await alert.save();

    // Notify the requester via Socket.io so their MyRequests page auto-refreshes
    const io = req.app.get("io");
    if (io && alert.bloodRequest?.requester) {
      const requesterId = alert.bloodRequest.requester.toString();
      io.to(requesterId).emit("notification_update", {
        type: "donor_accepted",
        receiver: requesterId,
      });

      // Also notify the donor (current user) to refresh their own view
      io.to(req.user._id.toString()).emit("notification_update", {
        type: "self_accepted",
        receiver: req.user._id.toString()
      });
    }

    // Auto-close if accepted donors count >= required units
    const requiredUnits = alert.bloodRequest.units || 1;
    if (alert.acceptedDonors.length >= requiredUnits) {
      alert.bloodRequest.status = "closed";
      alert.bloodRequest.closedAt = new Date();
      await alert.bloodRequest.save();

      // Extend alert expiry to 24h from now
      alert.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await alert.save();

      // Notify others that the alert is now closed (global update)
      if (io) {
        io.emit("notification_update", { type: "alert" });
      }

      return res.status(200).json({
        message: "You accepted the request. All units fulfilled — request is now closed!",
        requestClosed: true,
      });
    }

    res.status(200).json({
      message: `You accepted the request. ${requiredUnits - alert.acceptedDonors.length} more donor(s) needed.`,
      requestClosed: false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❌ Reject alert (per user)
const rejectAlert = async (req, res) => {
  try {
    const { alertId } = req.body;

    const alert = await Alert.findById(alertId);

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    // Check if already rejected (choice is locked)
    if (alert.rejectedDonors.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: "You have already rejected this request" });
    }

    // Check if already accepted (choice is locked)
    const alreadyAccepted = alert.acceptedDonors.some(
      (d) => d.user.toString() === req.user._id.toString()
    );
    if (alreadyAccepted) {
      return res.status(400).json({ message: "You have already accepted this request" });
    }

    alert.rejectedDonors.push(req.user._id);
    await alert.save();

    res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAlerts,
  acceptAlert,
  rejectAlert,
};
