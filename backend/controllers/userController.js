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
      profile.pincode;

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

module.exports = { getUserProfile, updateUserProfile };