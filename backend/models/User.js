const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: false,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: String,
    otpExpiry: Date,

    // ✅ New field
    profileCompleted: {
      type: Boolean,
      default: false,
    },

    profile: {
      name: String,
      photo: String,
      dob: Date,
      age: Number,
      gender: String,
      bloodGroup: String,
      phone: String,
      address: String,
      pincode: String,
      lastDonationDate: Date,
      availableToDonate: {
        type: Boolean,
        default: true,
      },
      lastViewedAlerts: {
        type: Date,
        default: Date.now,
      },
      club: {
        type: String,
        enum: ["NSS", "NCC", "Redcross", "none"],
        default: "none",
      },
      clubRole: {
        type: String,
        enum: ["admin", "member"],
        default: "member",
      },
      isAdminApproved: {
        type: Boolean,
        default: false,
      },
    },

    donationHistory: [
      {
        date: Date,
        units: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);