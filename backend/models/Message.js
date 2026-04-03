const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        bloodRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BloodRequest",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// TTL index to automatically delete messages older than 90 days
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("Message", messageSchema);
