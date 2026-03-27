const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const fs = require("fs");

dotenv.config();

const testQuery = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}).select("email profile.club profile.clubRole");
        let output = "All Users:\n";
        users.forEach(u => {
            output += `Email: ${u.email}, Club: ${u.profile?.club}, Role: ${u.profile?.clubRole}\n`;
        });
        fs.writeFileSync("user_list.txt", output);
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
};

testQuery();
