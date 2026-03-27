const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const adminEmail = "chakravarthikakarla@gmail.com";
        const user = await User.findOne({ email: adminEmail });
        if (!user) {
            console.log("Admin user not found");
            process.exit(0);
        }

        user.profile.club = "NSS";
        user.profile.clubRole = "admin"; // Make sure they are admin
        await user.save();

        console.log(`Admin ${adminEmail} updated to NSS Admin`);
        process.exit(0);
    } catch (err) {
        console.error("Update failed:", err);
        process.exit(1);
    }
};

updateAdmin();
