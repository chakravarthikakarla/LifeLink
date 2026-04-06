const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { isWithinCooldown } = require("../utils/cooldown");
const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL || "debateverse80@gmail.com";

const getUserProfile = async (req, res) => {
  try {
    const userObj = req.user.toObject();
    const lastDonation = userObj.profile?.lastDonationDate;
    const gender = userObj.profile?.gender;

    if (lastDonation && isWithinCooldown(lastDonation, gender)) {
      userObj.profile.availableToDonate = false;
    }
    res.status(200).json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    console.log("Updating profile for user:", req.user._id);
    console.log("Update data:", req.body);
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.profile) {
      user.profile = {};
    }

    // Update fields
    user.profile.photo = req.body.photo ?? user.profile.photo;
    user.profile.name = req.body.name ?? user.profile.name;
    user.profile.phone = req.body.phone ?? user.profile.phone;
    user.profile.bloodGroup = req.body.bloodGroup ?? user.profile.bloodGroup;
    user.profile.gender = req.body.gender ?? user.profile.gender;
    user.profile.address = req.body.address ?? user.profile.address;
    user.profile.pincode = req.body.pincode ?? user.profile.pincode;
    user.profile.club = req.body.club ?? user.profile.club;
    
    const isRequestingAdminRole = req.body.clubRole === "admin" && user.profile.clubRole !== "admin" && user.email !== MASTER_ADMIN_EMAIL;

    // admin approval logic
    if (req.body.clubRole === "admin" && user.profile.clubRole !== "admin") {
      // If user is requesting to become an admin, set approval to false
      // Unless they are the master admin
      if (user.email !== MASTER_ADMIN_EMAIL) {
        user.profile.isAdminApproved = false;
      } else {
        user.profile.isAdminApproved = true;
      }
    }
    user.profile.clubRole = req.body.clubRole ?? user.profile.clubRole;

    if (req.body.availableToDonate !== undefined) {
      user.profile.availableToDonate = req.body.availableToDonate;
    }

    if (req.body.lastDonationDate) {
      user.profile.lastDonationDate = new Date(req.body.lastDonationDate);
    }

    // DOB and age calculation
    if (req.body.dob) {
      const dob = new Date(req.body.dob);
      const today = new Date();

      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        age--;
      }

      user.profile.dob = dob;
      user.profile.age = age;
    }

    // ✅ Check profile completion
    const profile = user.profile;

    const profileCompleted =
      profile.name &&
      profile.phone &&
      profile.bloodGroup &&
      profile.gender &&
      profile.dob &&
      profile.address &&
      profile.pincode &&
      profile.club &&
      (profile.club === "none" || profile.clubRole);

    user.profileCompleted = !!profileCompleted;

    await user.save();

    if (isRequestingAdminRole) {
      const frontendURL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
      const viewAndRespondLink = `${frontendURL}/admin-requests?viewRequestId=${user._id}`;
      
      const adminRequestEmailHtml = `
        <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:auto; border:1px solid #eee; padding:20px; border-radius:10px;">
          <h2 style="color:#6a0026; text-align:center;">New Admin Role Request</h2>
          <p>Master Admin,</p>
          <p><strong>${user.profile?.name || user.email}</strong> has requested admin access for club <strong>${user.profile?.club || "N/A"}</strong> on LifeLink.</p>
          <p>Please review and approve or reject this request from the Master Admin dashboard.</p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:30px 0;">
            <tr>
              <td align="center">
                <a href="${viewAndRespondLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background-color:#6a0026; color:white; padding:14px 28px; text-decoration:none; border-radius:8px; font-weight:600; font-size:16px;">View & Respond</a>
              </td>
            </tr>
          </table>
          <p style="font-size:14px; color:#444;">If the button does not appear, use this link:</p>
          <p style="word-break:break-all; font-size:14px; color:#1a0dab;"><a href="${viewAndRespondLink}" target="_blank" rel="noopener noreferrer" style="color:#1a0dab; text-decoration:underline;">${viewAndRespondLink}</a></p>
          <p style="color:#666; font-size:12px;">If you're not the Master Admin or didn't expect this email, please ignore it.</p>
          <p>Best regards,<br/><strong>The LifeLink Team</strong></p>
        </div>
      `;

      await sendEmail(MASTER_ADMIN_EMAIL, "LifeLink - New Admin Role Request", adminRequestEmailHtml);
    }

    res.status(200).json({
      message: "Profile updated successfully",
      profileCompleted: user.profileCompleted,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClubMembers = async (req, res) => {
  try {
    const adminClub = req.user.profile?.club;
    const profile = req.user.profile;
    console.log("Admin Club:", adminClub);
    console.log("Admin ID:", req.user._id);

    if (!adminClub || adminClub === "none") {
      return res.status(400).json({ message: "No club associated with this account" });
    }

    if (profile?.clubRole !== "admin" || !profile?.isAdminApproved) {
      return res.status(403).json({ message: "Only approved club admins can view members." });
    }

    const members = await User.find({
      "profile.club": adminClub,
      _id: { $ne: req.user._id }
    }).select("profile email");

    const membersWithAvailability = members.map(m => {
      const memberObj = m.toObject();
      const lastDonation = memberObj.profile?.lastDonationDate;
      const gender = memberObj.profile?.gender;
      
      // Override availability if in cooldown
      if (lastDonation && isWithinCooldown(lastDonation, gender)) {
        memberObj.profile.availableToDonate = false;
      }
      return memberObj;
    });

    res.status(200).json(membersWithAvailability);
  } catch (error) {
    console.error("getClubMembers error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMemberProfile = async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = await User.findById(memberId).select("-password").lean();

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Security check
    const requesterClub = req.user.profile?.club;
    if (member.profile?.club !== requesterClub) {
      return res.status(403).json({ message: "Access denied." });
    }

    const lastDonation = member.profile?.lastDonationDate;
    const gender = member.profile?.gender;
    const inCooldown = lastDonation && isWithinCooldown(lastDonation, gender);

    console.log(`[DEBUG] Member Profile: ${member.email}, lastDonation=${lastDonation}, inCooldown=${inCooldown}`);

    // If they are in cooldown, force availability to false
    if (inCooldown) {
      member.profile.availableToDonate = false;
    }

    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const memberId = req.params.id;
    const adminProfile = req.user.profile;
    const adminClub = adminProfile?.club;

    if (!adminClub || adminClub === "none" || adminProfile?.clubRole !== "admin" || !adminProfile?.isAdminApproved) {
      return res.status(403).json({ message: "Only approved club admins can remove members." });
    }

    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (member.profile?.club !== adminClub) {
      return res.status(403).json({ message: "You can only remove members from your own club." });
    }

    // Remove member from club
    member.profile.club = "none";
    member.profile.clubRole = "";
    
    // Check if profile is still completed (it might not be if club/role was required)
    const profile = member.profile;
    const profileCompleted =
      profile.name &&
      profile.phone &&
      profile.bloodGroup &&
      profile.gender &&
      profile.dob &&
      profile.address &&
      profile.pincode &&
      profile.club &&
      (profile.club === "none" || profile.clubRole);

    member.profileCompleted = !!profileCompleted;

    await member.save();

    res.status(200).json({ message: "Member removed from club successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClubDonations = async (req, res) => {
  try {
    const profile = req.user.profile;
    const adminClub = profile?.club;

    if (!adminClub || adminClub === "none" || profile?.clubRole !== "admin" || !profile?.isAdminApproved) {
      return res.status(403).json({ message: "Only approved club admins can view donation records." });
    }

    // Find all users in the same club
    const members = await User.find({ "profile.club": adminClub }).select("profile donationHistory email");
    console.log(`Found ${members.length} members for club ${adminClub}`);

    // Flatten donation history and associate with member names
    let allDonations = [];
    members.forEach(member => {
      console.log(`Checking member: ${member.email}, donations: ${member.donationHistory?.length || 0}`);
      if (member.donationHistory && member.donationHistory.length > 0) {
        member.donationHistory.forEach(donation => {
          allDonations.push({
            _id: donation._id,
            date: donation.date,
            units: donation.units,
            memberName: member.profile?.name || "Anonymous",
            memberEmail: member.email,
            memberId: member._id,
            bloodGroup: member.profile?.bloodGroup
          });
        });
      }
    });

    console.log(`Total flattened donations: ${allDonations.length}`);

    // Sort by date descending
    allDonations.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json(allDonations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getUserProfile, 
  updateUserProfile, 
  getClubMembers, 
  getMemberProfile,
  removeMember,
  getClubDonations
};