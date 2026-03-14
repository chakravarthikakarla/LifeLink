const mongoose = require("mongoose");
const Alert = require("../models/Alert");
const BloodRequest = require("../models/BloodRequest");
const Message = require("../models/Message");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const ONE_TWENTY_DAYS_MS = 120 * 24 * 60 * 60 * 1000;

const isWithinDonationCooldown = (lastDonationDate, gender) => {
  if (!lastDonationDate) return false;
  const last = new Date(lastDonationDate).getTime();
  if (Number.isNaN(last)) return false;
  const cooldownMs = gender === "Female" ? ONE_TWENTY_DAYS_MS : NINETY_DAYS_MS;
  return Date.now() - last < cooldownMs;
};

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
    const userGender = req.user.profile?.gender;
    const userAge = req.user.profile?.age;
    const userOnCooldown = isWithinDonationCooldown(req.user.profile?.lastDonationDate, userGender);
    const userUnderAge = !userAge || userAge < 18;

    alerts = alerts.filter((alert) => {
      if (!alert.bloodRequest) return false;

      // 🚫 Exclude under-18 users from seeing any alerts
      if (userUnderAge) return false;

      const isTargetedDonor = alert.donors?.some((id) => id.toString() === currentUserId);
      const hasAccepted = alert.acceptedDonors?.some((d) => d.user?.toString() === currentUserId);
      const hasRejected = alert.rejectedDonors?.some((id) => id.toString() === currentUserId);
      if (!isTargetedDonor && !hasAccepted && !hasRejected) return false;
      
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

        obj.canAccept = !accepted && !obj.rejectedDonors?.some((id) => id.toString() === obj._myId) && obj.bloodRequest?.status === "active" && !userOnCooldown && !userUnderAge;
        if (!obj.canAccept && obj.bloodRequest?.status === "active") {
          if (userUnderAge) {
            obj.acceptDisabledReason = "You must be at least 18 years old to donate.";
          } else if (userOnCooldown) {
            const cooldownDays = userGender === "Female" ? 120 : 90;
            obj.acceptDisabledReason = `You donated recently. You can accept again after ${cooldownDays} days.`;
          }
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

    if (isWithinDonationCooldown(req.user.profile?.lastDonationDate)) {
      return res.status(400).json({ message: "You donated recently and cannot accept requests for 90 days" });
    }

    alert.acceptedDonors.push({
      user: req.user._id,
      acceptedAt: new Date(),
    });

    await alert.save();

    // Notify requester by email when a donor accepts
    try {
      const requester = await User.findById(alert.bloodRequest.requester).select("email profile.name");
      if (requester?.email) {
        const donorName = req.user.profile?.name || req.user.email || "A donor";
        const requiredDateStr = new Date(alert.bloodRequest.requiredDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const requestLink = `${process.env.FRONTEND_URL}/my-requests`;

        const html = `
          <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:auto; border:1px solid #ddd; padding:20px; border-radius:8px;">
            <h2 style="color:#198754;">✅ Donor Accepted Your Blood Request</h2>
            <p>Dear ${requester.profile?.name || "Requester"},</p>
            <p><strong>${donorName}</strong> has accepted your blood request.</p>
            <div style="background:#f8f9fa; padding:15px; border-radius:6px;">
              <p><strong>Patient:</strong> ${alert.bloodRequest.patientName}</p>
              <p><strong>Blood Group:</strong> ${alert.bloodRequest.bloodGroup}</p>
              <p><strong>Units Needed:</strong> ${alert.bloodRequest.units}</p>
              <p><strong>Required By:</strong> ${requiredDateStr}</p>
            </div>
            <div style="text-align:center; margin:24px 0;">
              <a href="${requestLink}" style="background:#198754;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
                Open My Requests
              </a>
            </div>
            <p>Thank you for using LifeLink.</p>
          </div>
        `;

        await sendEmail(
          requester.email,
          "LifeLink: A donor accepted your request",
          html
        );
      }
    } catch (emailError) {
      console.error("Requester acceptance email failed:", emailError.message);
    }

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

    res.status(200).json({
      message: "You accepted the request.",
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
