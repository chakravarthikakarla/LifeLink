const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

const BACKEND_DIR = "c:\\Projects\\WEB\\LifeLink\\backend";

// Load backend .env
dotenv.config({ path: path.join(BACKEND_DIR, ".env") });

const User = require(path.join(BACKEND_DIR, "models", "User"));

const seedMasterAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI not found in .env");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const email = "debateverse80@gmail.com";
    const password = "admin123";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("Master Admin already exists. Updating password...");
      existingUser.password = await bcrypt.hash(password, 10);
      existingUser.isVerified = true;
      existingUser.profile = existingUser.profile || {};
      existingUser.profile.name = "Master Admin";
      existingUser.profile.clubRole = "admin";
      existingUser.profile.isAdminApproved = true;
      existingUser.profile.club = "none";
      existingUser.profileCompleted = true;
      await existingUser.save();
      console.log("Master Admin updated.");
    } else {
      console.log("Creating Master Admin...");
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        email,
        password: hashedPassword,
        isVerified: true,
        profile: {
          name: "Master Admin",
          clubRole: "admin",
          isAdminApproved: true,
          club: "none"
        },
        profileCompleted: true
      });
      console.log("Master Admin created.");
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding Master Admin:", error);
    process.exit(1);
  }
};

seedMasterAdmin();
