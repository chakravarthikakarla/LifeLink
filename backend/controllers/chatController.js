const Message = require("../models/Message");

// Get chat history for a specific blood request between two users
exports.getChatHistory = async (req, res) => {
    try {
        const { requestId, targetUserId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Message.find({
            bloodRequest: requestId,
            $or: [
                { sender: currentUserId, receiver: targetUserId },
                { sender: targetUserId, receiver: currentUserId },
            ],
        }).sort({ createdAt: 1 });

        // Mark messages as read where current user is receiver
        await Message.updateMany(
            {
                bloodRequest: requestId,
                sender: targetUserId,
                receiver: currentUserId,
                isRead: false,
            },
            { isRead: true }
        );

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Get total unread messages count for current user
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.user._id,
            isRead: false,
        });
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Mark all messages in a conversation as read
exports.markAsRead = async (req, res) => {
    try {
        const { requestId, targetUserId } = req.body;
        const currentUserId = req.user._id;

        await Message.updateMany(
            {
                bloodRequest: requestId,
                sender: targetUserId,
                receiver: currentUserId,
                isRead: false,
            },
            { isRead: true }
        );

        // Notify receiver via their private notification room to refresh UI/Navbar counts
        const io = req.app.get("io");
        if (io) {
            io.to(currentUserId.toString()).emit("notification_update", { 
                type: "message_read",
                receiver: currentUserId.toString()
            });
        }

        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
