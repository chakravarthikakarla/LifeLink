const User = require("../models/User");
const BloodRequest = require("../models/BloodRequest");

// @desc    Get Club Leaderboard
// @route   GET /api/achievements/leaderboard
// @access  Public (or Private, depending on preference)
const getLeaderboard = async (req, res) => {
  try {
    const clubs = ["NSS", "NCC", "Redcross"];
    
    // Aggregate donation history by club
    const leaderboard = await Promise.all(clubs.map(async (clubName) => {
      const users = await User.find({ "profile.club": clubName });
      
      let totalUnits = 0;
      let totalDonations = 0;
      let memberCount = users.length;

      users.forEach(user => {
        if (user.donationHistory) {
          totalDonations += user.donationHistory.length;
          user.donationHistory.forEach(donation => {
            // Parse units as number, default to 1 if not specified or invalid
            const units = parseFloat(donation.units) || 1;
            totalUnits += units;
          });
        }
      });

      return {
        name: clubName,
        units: totalUnits,
        donations: totalDonations,
        members: memberCount,
        livesSaved: Math.round(totalUnits * 3) // 1 unit = ~3 lives saved
      };
    }));

    // Sort by units descending
    leaderboard.sort((a, b) => b.units - a.units);

    res.status(200).json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// @desc    Get Personal Achievements & Global Stats
// @route   GET /api/achievements/stats
// @access  Private
const getUserAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Personal Stats
    const totalDonations = user.donationHistory ? user.donationHistory.length : 0;
    let totalUnits = 0;
    if (user.donationHistory) {
      user.donationHistory.forEach(d => {
        totalUnits += parseFloat(d.units) || 1;
      });
    }

    // 2. Badges Calculation
    const badges = [];
    if (totalDonations >= 1) badges.push({ id: "first_blood", name: "Novice Bloodhound", level: "Bronze", icon: "🩸" });
    if (totalDonations >= 5) badges.push({ id: "silver_donor", name: "Silver Guardian", level: "Silver", icon: "🛡️" });
    if (totalDonations >= 10) badges.push({ id: "lifesaver_elite", name: "Lifesaver Elite", level: "Gold", icon: "🏆" });
    if (totalDonations >= 25) badges.push({ id: "legendary_hero", name: "Legendary Hero", level: "Platinum", icon: "👑" });

    // 3. Global Stats (for the Pulse section)
    const allUsers = await User.find({});
    let globalUnits = 0;
    const bloodGroupCounts = {};

    allUsers.forEach(u => {
      // Track total units
      u.donationHistory?.forEach(d => {
        globalUnits += parseFloat(d.units) || 1;
      });

      // Track blood group frequency
      const bg = u.profile?.bloodGroup;
      if (bg) {
        bloodGroupCounts[bg] = (bloodGroupCounts[bg] || 0) + 1;
      }
    });

    // Determine Top Blood Group
    let topBG = "O+";
    let topBGCount = 0;
    Object.entries(bloodGroupCounts).forEach(([bg, count]) => {
      if (count > topBGCount) {
        topBGCount = count;
        topBG = bg;
      }
    });
    const topBGPercent = allUsers.length > 0 ? Math.round((topBGCount / allUsers.length) * 100) : 0;

    // 4. Calculate Urgent Responses (Emergency/Urgent requests that are closed)
    const urgentRequestsFulfilled = await BloodRequest.countDocuments({
      urgency: { $in: ["Emergency", "Urgent"] },
      status: "closed"
    });

    res.status(200).json({
      personal: {
        totalDonations,
        totalUnits,
        livesSaved: Math.round(totalUnits * 3),
        badges,
        nextMilestone: totalDonations < 1 ? 1 : totalDonations < 5 ? 5 : totalDonations < 10 ? 10 : totalDonations < 25 ? 25 : null
      },
      global: {
        totalUnits: globalUnits,
        totalLivesSaved: Math.round(globalUnits * 3),
        totalDonors: allUsers.length,
        topBloodGroup: `${topBG} (${topBGPercent}%)`,
        urgentResponses: `${urgentRequestsFulfilled} Successful`
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

module.exports = {
  getLeaderboard,
  getUserAchievements
};
