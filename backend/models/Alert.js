const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  bloodRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BloodRequest",
    required: true,
  },
  bloodGroup: {
    type: String,
    required: true,
  },
  donors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  acceptedDonors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acceptedAt: {
      type: Date,
      default: Date.now,
    },
    donationDone: {
      type: Boolean,
      default: false,
    },
    donatedUnits: {
      type: Number,
      default: 0,
    },
    donationDate: {
      type: Date,
    },
  }],
  rejectedDonors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
}, { timestamps: true });

module.exports = mongoose.model("Alert", alertSchema);