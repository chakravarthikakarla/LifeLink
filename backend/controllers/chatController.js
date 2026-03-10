const Message = require("../models/Message");

// Get chat history for a specific blood request between two users
exports.getChatHistory = async (req, res) => {
    try {
        const { requestId, targetUserId } = req.params;
        const currentUserId = req.user.id;

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
        console.error("Error fetching chat history:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get total unread messages count for current user
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.user.id,
            isRead: false,
        });
        res.status(200).json({ count });
    } catch (error) {
        console.error("Error getting unread count:", error);
        res.status(500).json({ message: "Server error" });
    }
};
