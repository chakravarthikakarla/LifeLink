const mongoose = require("mongoose");
const BloodRequest = require("../models/BloodRequest");
const Alert = require("../models/Alert");
const User = require("../models/User");
const Message = require("../models/Message");
const sendEmail = require("../utils/sendEmail");

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const ONE_TWENTY_DAYS_MS = 120 * 24 * 60 * 60 * 1000;

const isWithinDonationCooldown = (lastDonationDate) => {
  if (!lastDonationDate) return false;
  const last = new Date(lastDonationDate).getTime();
  if (Number.isNaN(last)) return false;
  return Date.now() - last < NINETY_DAYS_MS;
};

const sendBloodRequestEmails = async ({ donors, bloodRequest, bloodGroup, patientName, units, requestAddress, phone, urgency, requiredDate }) => {
  if (!donors.length) {
    return { sentCount: 0, failedCount: 0 };
  }

  const requiredDateStr = new Date(requiredDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const urgencyColor =
    urgency === "Emergency" ? "#d9534f" : urgency === "Urgent" ? "#f0ad4e" : "#5cb85c";

  const alertLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/alerts`;

  const emailPromises = donors
    .filter((donor) => donor.email)
    .map((donor) => {
      const html = `
  <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:auto; border:1px solid #ddd; padding:20px; border-radius:8px;">

    <h2 style="color:#d9534f;">🩸 Blood Required - Please Help!</h2>

    <p>Dear ${donor.profile?.name || "Donor"},</p>

    <p>
    A patient urgently needs your blood type <strong>${bloodGroup}</strong>.
    As a registered donor, you make a critical difference!
    </p>

    <div style="background:#f8f9fa; padding:15px; border-radius:6px;">
      <p><strong>Patient:</strong> ${patientName}</p>
      <p><strong>Blood Group:</strong> ${bloodGroup}</p>
      <p><strong>Units Needed:</strong> ${units}</p>
      <p><strong>Required By:</strong> ${requiredDateStr}</p>
      <p><strong>Location:</strong> ${requestAddress}</p>
      <p><strong>Contact:</strong> ${phone}</p>
      <p style="color:${urgencyColor};"><strong>Urgency:</strong> ${urgency || "Normal"}</p>
    </div>

    <div style="text-align:center; margin:30px 0;">
      <a href="${alertLink}"
      style="
        background:#d9534f;
        color:white;
        padding:12px 24px;
        text-decoration:none;
        border-radius:6px;
        font-weight:bold;
        display:inline-block;
      ">
      View Alert & Respond
      </a>
    </div>

    <p>Please log in to LifeLink to view full details and accept this request.</p>
    <p>Every drop counts. Thank you for your noble service! ❤️</p>
    <p>Best regards,<br/><strong>The LifeLink Team</strong></p>

  </div>
  `;

      return sendEmail(
        donor.email,
        `🩸 LifeLink: Blood Request - ${bloodGroup} Needed`,
        html
      );
    });

  const emailResults = await Promise.all(emailPromises);
  const sentCount = emailResults.filter(Boolean).length;
  const failedCount = emailResults.length - sentCount;

  return { sentCount, failedCount };
};

const createBloodRequest = async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      units,
      urgency,
      requestAddress,
      phone,
      requiredDate,
      message,
    } = req.body;

    if (!patientName || !bloodGroup || !units || !requestAddress || !phone || !requiredDate) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const bloodRequest = await BloodRequest.create({
      requester: req.user._id,
      patientName,
      bloodGroup,
      units,
      urgency: urgency || "Normal",
      requestAddress,
      phone,
      requiredDate,
      message,
      status: "active",
    });

    const normalizedBloodGroup = String(bloodGroup).trim();
    const escapedBloodGroup = normalizedBloodGroup.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const ninetyDaysAgo = new Date(Date.now() - NINETY_DAYS_MS);
    const oneHundredTwentyDaysAgo = new Date(Date.now() - ONE_TWENTY_DAYS_MS);

    // Find matching donors: same blood group, age >= 18, verified, available, out of gender-based cooldown
    const matchingDonors = await User.find({
      _id: { $ne: req.user._id },
      isVerified: true,
      profileCompleted: true,
      "profile.availableToDonate": true,
      "profile.bloodGroup": { $regex: `^${escapedBloodGroup}$`, $options: "i" },
      "profile.age": { $gte: 18 },
      $or: [
        { "profile.lastDonationDate": { $exists: false } },
        { "profile.lastDonationDate": null },
        { "profile.gender": "Male", "profile.lastDonationDate": { $lt: ninetyDaysAgo } },
        { "profile.gender": "Female", "profile.lastDonationDate": { $lt: oneHundredTwentyDaysAgo } },
        { "profile.gender": { $nin: ["Male", "Female"] }, "profile.lastDonationDate": { $lt: ninetyDaysAgo } },
      ],
    });

    // Always create an Alert so everyone can view globally
    await Alert.create({
      bloodRequest: bloodRequest._id,
      bloodGroup,
      donors: matchingDonors.map((u) => u._id),
    });

    // Notify all users via Socket.io so everyone sees the new alert
    const io = req.app.get("io");
    if (io) {
      io.emit("notification_update", { type: "alert" });
    }

    let sentCount = 0;
    let failedCount = 0;

    // Send email notification to each matching donor
    if (matchingDonors.length > 0) {
      const emailStats = await sendBloodRequestEmails({
        donors: matchingDonors,
        bloodRequest,
        bloodGroup,
        patientName,
        units,
        requestAddress,
        phone,
        urgency,
        requiredDate,
      });
      sentCount = emailStats.sentCount;
      failedCount = emailStats.failedCount;
      if (failedCount > 0) {
        console.log(`Blood request email delivery: sent=${sentCount}, failed=${failedCount}`);
      }
    } else {
      // No donors found
    }

    res.status(201).json({
      message: "Blood request created successfully",
      bloodRequest,
      matchedDonors: matchingDonors.length,
      emailSent: sentCount,
      emailFailed: failedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user's blood requests with accepted donor details and unread message counts
const getMyRequests = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get all active requests and recently closed requests (within 24 hours)
    const requests = await BloodRequest.find({
      requester: req.user._id,
      $or: [
        { status: "active" },
        { status: "closed", closedAt: { $gte: twentyFourHoursAgo } },
      ],
    }).sort({ createdAt: -1 });

    // For each request, find the alert and get accepted donors
    const requestsWithDonors = await Promise.all(
      requests.map(async (request) => {
        try {
          const alert = await Alert.findOne({
            bloodRequest: request._id,
          }).populate({
            path: "acceptedDonors.user",
            select: "email profile.name profile.phone profile.bloodGroup profile.gender",
          });

          const reqObj = request.toObject();

          // Count unread messages for each donor
          const donorsData = alert ? alert.acceptedDonors : [];
          reqObj.acceptedDonors = await Promise.all(
            donorsData
              .filter((d) => d.user) // skip entries with missing user reference
              .sort((a, b) => new Date(a.acceptedAt) - new Date(b.acceptedAt))
              .map(async (d) => {
                const unreadCount = await Message.countDocuments({
                  bloodRequest: new mongoose.Types.ObjectId(request._id),
                  sender: new mongoose.Types.ObjectId(d.user?._id),
                  receiver: new mongoose.Types.ObjectId(req.user._id),
                  isRead: false
                });

                return {
                  _id: d.user?._id,
                  name: d.user?.profile?.name || "Unknown",
                  email: d.user?.email || "",
                  phone: d.user?.profile?.phone || "",
                  bloodGroup: d.user?.profile?.bloodGroup || "",
                  gender: d.user?.profile?.gender || "",
                  acceptedAt: d.acceptedAt,
                  donationDone: !!d.donationDone,
                  donatedUnits: d.donatedUnits || 0,
                  donationDate: d.donationDate || null,
                  unreadCount
                };
              })
          );

          return reqObj;
        } catch (innerErr) {
          const reqObj = request.toObject();
          reqObj.acceptedDonors = [];
          return reqObj;
        }
      })
    );

    res.status(200).json(requestsWithDonors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markDonationDone = async (req, res) => {
  try {
    const { requestId, donorId, donatedUnits } = req.body;
    const numericUnits = Number(donatedUnits);

    if (!requestId || !donorId || !numericUnits || numericUnits <= 0) {
      return res.status(400).json({ message: "requestId, donorId and valid donatedUnits are required" });
    }

    const request = await BloodRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const alert = await Alert.findOne({ bloodRequest: request._id });
    if (!alert) {
      return res.status(404).json({ message: "Alert not found for this request" });
    }

    const acceptedEntry = alert.acceptedDonors.find(
      (d) => d.user?.toString() === donorId
    );

    if (!acceptedEntry) {
      return res.status(400).json({ message: "This donor has not accepted the request" });
    }

    if (acceptedEntry.donationDone) {
      return res.status(400).json({ message: "Donation already marked as done for this donor" });
    }

    const donor = await User.findById(donorId);
    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    acceptedEntry.donationDone = true;
    acceptedEntry.donatedUnits = numericUnits;
    acceptedEntry.donationDate = new Date();
    await alert.save();

    donor.profile = donor.profile || {};
    donor.profile.lastDonationDate = new Date();
    donor.donationHistory.push({
      date: new Date(),
      units: String(numericUnits),
    });
    await donor.save();

    request.units = Math.max(0, Number(request.units || 0) - numericUnits);

    let renotifySent = 0;
    let renotifyFailed = 0;

    if (request.units <= 0) {
      request.status = "closed";
      request.closedAt = new Date();
      alert.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await alert.save();
    } else {
      const normalizedBloodGroup = String(request.bloodGroup).trim();
      const escapedBloodGroup = normalizedBloodGroup.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const ninetyDaysAgo = new Date(Date.now() - NINETY_DAYS_MS);
      const oneHundredTwentyDaysAgo = new Date(Date.now() - ONE_TWENTY_DAYS_MS);

      const excludedIds = [
        req.user._id,
        ...alert.acceptedDonors.map((d) => d.user),
        ...alert.rejectedDonors,
      ].map((id) => id.toString());

      const eligibleDonors = await User.find({
        _id: { $nin: excludedIds },
        isVerified: true,
        profileCompleted: true,
        "profile.availableToDonate": true,
        "profile.bloodGroup": { $regex: `^${escapedBloodGroup}$`, $options: "i" },
        "profile.age": { $gte: 18 },
        $or: [
          { "profile.lastDonationDate": { $exists: false } },
          { "profile.lastDonationDate": null },
          { "profile.gender": "Male", "profile.lastDonationDate": { $lt: ninetyDaysAgo } },
          { "profile.gender": "Female", "profile.lastDonationDate": { $lt: oneHundredTwentyDaysAgo } },
          { "profile.gender": { $nin: ["Male", "Female"] }, "profile.lastDonationDate": { $lt: ninetyDaysAgo } },
        ],
      });

      alert.donors = eligibleDonors.map((d) => d._id);
      await alert.save();

      const emailStats = await sendBloodRequestEmails({
        donors: eligibleDonors,
        bloodRequest: request,
        bloodGroup: request.bloodGroup,
        patientName: request.patientName,
        units: request.units,
        requestAddress: request.requestAddress,
        phone: request.phone,
        urgency: request.urgency,
        requiredDate: request.requiredDate,
      });
      renotifySent = emailStats.sentCount;
      renotifyFailed = emailStats.failedCount;
    }

    await request.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("notification_update", { type: "alert" });
      io.to(request.requester.toString()).emit("notification_update", {
        type: "request_updated",
        receiver: request.requester.toString(),
      });
      io.to(donorId.toString()).emit("notification_update", {
        type: "donation_marked",
        receiver: donorId.toString(),
      });
    }

    res.status(200).json({
      message: request.units > 0
        ? "Donation marked. Remaining units updated and donors re-notified."
        : "Donation marked. Request fulfilled and closed.",
      remainingUnits: request.units,
      requestClosed: request.status === "closed",
      renotifySent,
      renotifyFailed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Close a blood request
const closeBloodRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await BloodRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Only the requester can close their own request
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    request.status = "closed";
    request.closedAt = new Date();
    await request.save();

    // Also update the associated Alert's expiresAt to ensure it stays visible for 24h
    // We use the request._id to avoid any string/ObjectId mismatch
    await Alert.findOneAndUpdate(
      { bloodRequest: request._id },
      { $set: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } }
    );

    // Notify all users via socket to refresh their alerts page
    const io = req.app.get("io");
    if (io) {
      io.emit("notification_update", { type: "alert" });
    }

    res.status(200).json({ message: "Request closed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all active blood requests across the system
const getAllActiveRequests = async (req, res) => {
  try {
    const activeRequests = await BloodRequest.find({
      status: "active",
    })
      .sort({ createdAt: -1 })
      .populate("requester", "profile.name email"); // Populate basic details

    res.status(200).json(activeRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single blood request by ID
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BloodRequest.findById(id).populate("requester", "profile.name email");
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get unread alerts count for current user (matched after lastViewedAlerts)
const getUnreadAlertCount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const lastViewed = user.profile?.lastViewedAlerts || user.createdAt;
    const currentUserId = req.user._id.toString();

    // Find all alerts created since lastViewed or since user joined
    const recentAlerts = await Alert.find({
      $or: [
        { createdAt: { $gt: lastViewed } },
        { createdAt: { $gt: user.createdAt } }
      ]
    }).populate("bloodRequest");

    const unreadAlerts = recentAlerts.filter(alert => {
      if (!alert.bloodRequest) return false;

      // Exclude under-18 users
      const userAge = user.profile?.age;
      if (!userAge || userAge < 18) return false;

      const requesterId = (alert.bloodRequest.requester?._id || alert.bloodRequest.requester)?.toString();
      const isRequester = requesterId === currentUserId;
      
      const hasAccepted = alert.acceptedDonors.some(d => d.user?.toString() === currentUserId);
      const hasRejected = alert.rejectedDonors.some(id => id?.toString() === currentUserId);

      return !isRequester && !hasAccepted && !hasRejected;
    });

    res.status(200).json({ count: unreadAlerts.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark alerts as viewed
const markAlertsAsViewed = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      "profile.lastViewedAlerts": new Date()
    });
    const io = req.app.get("io");
    if (io) {
      io.to(req.user._id.toString()).emit("notification_update", { type: "alert_read" });
    }
    res.status(200).json({ message: "Alerts marked as viewed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBloodRequest,
  getMyRequests,
  markDonationDone,
  closeBloodRequest,
  getAllActiveRequests,
  getRequestById,
  getUnreadAlertCount,
  markAlertsAsViewed
};