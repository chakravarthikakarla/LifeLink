const mongoose = require("mongoose");
const User = require("./models/User");
const { isWithinCooldown } = require("./utils/cooldown");
const dotenv = require("dotenv");

dotenv.config();

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const user = await User.findOne({ email: "chakravarthikakarla7@gmail.com" });
  if (!user) {
    console.log("User not found");
    process.exit(0);
  }

  const lastDonation = user.profile.lastDonationDate;
  const gender = user.profile.gender;
  const available = user.profile.availableToDonate;
  
  console.log("User Info:");
  console.log("- Email:", user.email);
  console.log("- Gender:", gender);
  console.log("- Last Donation:", lastDonation);
  console.log("- Static Available Status:", available);
  
  const inCooldown = isWithinCooldown(lastDonation, gender);
  console.log("- Is within cooldown?", inCooldown);
  
  const effectiveAvailable = inCooldown ? false : available;
  console.log("- Effective Available Status:", effectiveAvailable);
  
  process.exit(0);
};

test();
