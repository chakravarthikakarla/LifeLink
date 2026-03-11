require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function createUsers() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB Connected");

  const User = require("../models/User");

  // Delete existing test users to avoid conflicts
  await User.deleteMany({ email: { $in: ["testuser@lifelink.com", "donor@lifelink.com"] } });

  const hashedPassword = await bcrypt.hash("Test@1234", 10);

  // Create requester user (the person who makes blood requests)
  const requester = await User.create({
    email: "testuser@lifelink.com",
    password: hashedPassword,
    isVerified: true,
    profileCompleted: true,
    profile: {
      name: "Test User",
      dob: new Date("1990-01-01"),
      age: 35,
      gender: "Male",
      bloodGroup: "O+",
      phone: "9876543210",
      address: "123 Test Street, Test City",
      pincode: "500001",
      availableToDonate: true,
    },
  });

  // Create donor user (a matching donor who will receive alerts)
  const donor = await User.create({
    email: "donor@lifelink.com",
    password: hashedPassword,
    isVerified: true,
    profileCompleted: true,
    profile: {
      name: "Donor User",
      dob: new Date("1995-06-15"),
      age: 30,
      gender: "Female",
      bloodGroup: "O+",
      phone: "9123456789",
      address: "456 Donor Lane, Donor City",
      pincode: "500002",
      availableToDonate: true,
    },
  });

  console.log("\n✅ Test users created:");
  console.log("──────────────────────────────────────────");
  console.log("👤 Requester:");
  console.log("   Email:    testuser@lifelink.com");
  console.log("   Password: Test@1234");
  console.log("   ID:      ", requester._id.toString());
  console.log("\n👤 Donor (O+ blood group, available):");
  console.log("   Email:    donor@lifelink.com");
  console.log("   Password: Test@1234");
  console.log("   ID:      ", donor._id.toString());
  console.log("──────────────────────────────────────────");

  mongoose.disconnect();
}

createUsers().catch(console.error);
