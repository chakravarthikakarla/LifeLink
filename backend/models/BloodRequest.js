const mongoose = require("mongoose");

const bloodRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    bloodGroup: {
      type: String,
      required: true,
    },
    units: {
      type: Number,
      required: true,
    },
    urgency: {
      type: String,
      enum: ["Normal", "Urgent", "Emergency"],
      default: "Normal",
      required: true,
    },
    requestAddress: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    requiredDate: {
      type: Date,
      required: true,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BloodRequest", bloodRequestSchema);
