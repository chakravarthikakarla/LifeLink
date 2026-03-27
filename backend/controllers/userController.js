const User = require("../models/User");

const getUserProfile = async (req, res) => {
  try {
    res.status(200).json(req.user);
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
    console.log("Admin Club:", adminClub);
    console.log("Admin ID:", req.user._id);

    if (!adminClub || adminClub === "none") {
      return res.status(400).json({ message: "No club associated with this account" });
    }

    const members = await User.find({
      "profile.club": adminClub,
      _id: { $ne: req.user._id }
    }).select("profile email");

    console.log("Found members count:", members.length);

    res.status(200).json(members);
  } catch (error) {
    console.error("getClubMembers error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMemberProfile = async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = await User.findById(memberId).select("-password");

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Security check: only allow if in same club or if requester is admin of that club
    const requesterClub = req.user.profile?.club;
    const isSameClub = member.profile?.club === requesterClub;

    if (!isSameClub) {
      return res.status(403).json({ message: "Access denied. Member belongs to a different club." });
    }

    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const memberId = req.params.id;
    const adminClub = req.user.profile?.club;

    if (!adminClub || adminClub === "none") {
      return res.status(403).json({ message: "Only club admins can remove members." });
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
    const adminClub = req.user.profile?.club;

    if (!adminClub || adminClub === "none") {
      return res.status(403).json({ message: "Only club admins can view donation records." });
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