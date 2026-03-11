const Alert = require("../models/Alert");
const BloodRequest = require("../models/BloodRequest");

// 🔔 Get alerts globally for logged-in user
const getAlerts = async (req, res) => {
  try {
    // Auto-close requests older than 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    await BloodRequest.updateMany(
      { status: "active", createdAt: { $lt: threeDaysAgo } },
      { status: "closed" }
    );

    let alerts = await Alert.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("bloodRequest")
      .sort({ createdAt: -1 });

    // Filter out alerts where bloodRequest is missing or closed
    alerts = alerts.filter(
      (alert) => alert.bloodRequest && alert.bloodRequest.status === "active"
    );

    // Attach current user's ID so frontend can check accept/reject status
    const alertsWithUserId = alerts.map((alert) => {
      const obj = alert.toObject();
      obj._myId = req.user._id.toString();
      return obj;
    });

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
      io.emit("notification_update", {
        type: "donor_accepted",
        receiver: alert.bloodRequest.requester.toString(),
      });
    }

    // Auto-close if accepted donors count >= required units
    const requiredUnits = alert.bloodRequest.units || 1;
    if (alert.acceptedDonors.length >= requiredUnits) {
      alert.bloodRequest.status = "closed";
      await alert.bloodRequest.save();
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
