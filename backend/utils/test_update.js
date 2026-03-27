const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const testUpdate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Find a "none" user
        const user = await User.findOne({ "profile.club": "none" });
        if (!user) {
            console.log("No 'none' user found to test");
            process.exit(0);
        }

        console.log("Testing update for:", user.email);
        
        // Simulate update
        user.profile.club = "NSS";
        user.profile.clubRole = "member";
        await user.save();

        const updatedUser = await User.findById(user._id);
        console.log("Updated club:", updatedUser.profile.club);

        if (updatedUser.profile.club === "NSS") {
            console.log("Update SUCCESSFUL");
        } else {
            console.log("Update FAILED");
        }

        // Revert (optional)
        // updatedUser.profile.club = "none";
        // await updatedUser.save();

        process.exit(0);
    } catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
};

testUpdate();
