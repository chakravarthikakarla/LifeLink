const BloodRequest = require("../models/BloodRequest");
const Alert = require("../models/Alert");
const User = require("../models/User");
const Message = require("../models/Message");

// Create blood request + send alerts + email matching donors
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

    // 90-day eligibility cutoff
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find matching donors: same blood group, available, eligible (90 day rule), exclude requester
    const matchingDonors = await User.find({
      _id: { $ne: req.user._id },
      isVerified: true,
      profileCompleted: true,
      "profile.bloodGroup": bloodGroup,
      "profile.availableToDonate": true,
      $or: [
        { "profile.lastDonationDate": { $exists: false } },
        { "profile.lastDonationDate": null },
        { "profile.lastDonationDate": { $lt: ninetyDaysAgo } },
      ],
    });

    // Always create an Alert so everyone can view globally
    await Alert.create({
      bloodRequest: bloodRequest._id,
      bloodGroup,
      donors: matchingDonors.map((u) => u._id),
    });

    // Notify matching donors via Socket.io
    const io = req.app.get("io");
    if (io) {
      matchingDonors.forEach((donor) => {
        io.emit("notification_update", { type: "alert", receiver: donor._id });
      });
    }

    // Send email notification to each matching donor
    if (matchingDonors.length > 0) {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });

      const requiredDateStr = new Date(requiredDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const urgencyColor =
        urgency === "Emergency" ? "#d9534f" : urgency === "Urgent" ? "#f0ad4e" : "#5cb85c";

      const emailPromises = matchingDonors.map((donor) => {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: donor.email,
          subject: `🚨 LifeLink: Urgent Blood Request - ${bloodGroup} Needed`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h2 style="color: #d9534f; border-bottom: 2px solid #eee; padding-bottom: 10px;">🩸 Blood Required - Please Help!</h2>
              <p>Dear ${donor.profile?.name || "Donor"},</p>
              <p>A patient urgently needs your blood type <strong>${bloodGroup}</strong>. As a registered donor, you make a critical difference!</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Patient:</strong> ${patientName}</p>
                <p><strong>Blood Group:</strong> ${bloodGroup}</p>
                <p><strong>Units Needed:</strong> ${units}</p>
                <p><strong>Required By:</strong> ${requiredDateStr}</p>
                <p><strong>Location:</strong> ${requestAddress}</p>
                <p><strong>Contact:</strong> ${phone}</p>
                <p><strong style="color: ${urgencyColor};">Urgency: ${urgency || "Normal"}</strong></p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/alerts" style="background-color: #d9534f; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Alert & Respond</a>
              </div>
              <p>Please log in to LifeLink to view full details and accept this request.</p>
              <p>Every drop counts. Thank you for your noble service! ❤️</p>
              <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
            </div>
          `,
        };
        return transporter.sendMail(mailOptions).catch((err) => {
          console.error(`Failed to email donor ${donor.email}:`, err.message);
        });
      });

      // Fire-and-forget, don't block the response
      Promise.all(emailPromises);
    }

    res.status(201).json({
      message: "Blood request created successfully",
      bloodRequest,
      matchedDonors: matchingDonors.length,
    });
  } catch (error) {
    console.error("Create blood request error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get current user's blood requests with accepted donor details and unread message counts
const getMyRequests = async (req, res) => {
  try {
    // DIAGNOSTIC LOGGING
    const fs = require('fs');
    fs.appendFileSync('c:/Projects/WEB/LifeLink/backend/debug.log', `[${new Date().toISOString()}] getMyRequests for user: ${req.user._id}\n`);

    // Get all blood requests made by this user
    const requests = await BloodRequest.find({
      requester: req.user._id,
    }).sort({ createdAt: -1 });

    fs.appendFileSync('c:/Projects/WEB/LifeLink/backend/debug.log', `[${new Date().toISOString()}] Found ${requests.length} requests\n`);

    // For each request, find the alert and get accepted donors
    const requestsWithDonors = await Promise.all(
      requests.map(async (request) => {
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
            .sort((a, b) => new Date(a.acceptedAt) - new Date(b.acceptedAt))
            .map(async (d) => {
              const unreadCount = await Message.countDocuments({
                bloodRequest: request._id,
                sender: d.user?._id,
                receiver: req.user._id,
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
                unreadCount
              };
            })
        );

        return reqObj;
      })
    );

    res.status(200).json(requestsWithDonors);
  } catch (error) {
    console.error("Get my requests error:", error);
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
    await request.save();

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
    console.error("Get all active requests error:", error);
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
    console.error("Get request by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get unread alerts count for current user (matched after lastViewedAlerts)
const getUnreadAlertCount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const lastViewed = user.profile?.lastViewedAlerts || user.createdAt;

    const count = await Alert.countDocuments({
      donors: req.user._id,
      createdAt: { $gt: lastViewed },
      "acceptedDonors.user": { $ne: req.user._id },
      "rejectedDonors.user": { $ne: req.user._id },
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Get unread alert count error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mark alerts as viewed
const markAlertsAsViewed = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      "profile.lastViewedAlerts": new Date()
    });
    res.status(200).json({ message: "Alerts marked as viewed" });
  } catch (error) {
    console.error("Mark alerts as viewed error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBloodRequest,
  getMyRequests,
  closeBloodRequest,
  getAllActiveRequests,
  getRequestById,
  getUnreadAlertCount,
  markAlertsAsViewed
};