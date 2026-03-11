import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../services/api";
import { io } from "socket.io-client";

// Ensure we connect to the correct backend URL
const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000", {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket']
});

const Chat = () => {
    const { requestId, donorId } = useParams();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [targetUserId, setTargetUserId] = useState(null);
    const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef(null);

    // We define the room ID based on the requestId and donorId. 
    // This ensures both the requester and the specific donor join the exact same unique room.
    const roomId = `${requestId}_${donorId}`;

    useEffect(() => {
        const fetchUserAndMessages = async () => {
            try {
                // 1. Get current user
                const resUser = await axios.get("/user/profile");
                setCurrentUser(resUser.data);

                // 2. We need to identify who we are chatting against (targetUserId)
                // If the current user is the donor, target userId is the requester. Wait.
                // We only have donorId and requestId in params.
                // Actually, we need to fetch the blood request details to see who the requester is.
                const resRequest = await axios.get(`/blood/request/${requestId}`);
                const requestData = resRequest.data;
                const requesterId = requestData.requester._id || requestData.requester;

                let targetId = requesterId;
                if (resUser.data._id === requesterId) {
                    targetId = donorId;
                }
                setTargetUserId(targetId);

                // 3. Get message history
                const resChat = await axios.get(`/chat/${requestId}/${targetId}`);
                setMessages(resChat.data);

                setLoading(false);

            } catch (err) {
                console.error("Error fetching chat data", err);
                setLoading(false);
            }
        };

        fetchUserAndMessages();
    }, [requestId, donorId]);

    useEffect(() => {
        // Connect Socket.io
        socket.connect();
        socket.emit("join_chat", roomId);

        socket.on("receive_message", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            socket.off("receive_message");
            socket.disconnect();
        };
    }, [roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !targetUserId) return;

        const messageData = {
            bloodRequest: requestId,
            sender: currentUser._id,
            receiver: targetUserId,
            text: newMessage,
            roomId,
        };

        socket.emit("send_message", messageData);
        setNewMessage("");
    };

    if (loading) return <div className="min-h-[calc(100vh-96px)] flex items-center justify-center">Loading chat...</div>;

    return (
        <div className="min-h-[calc(100vh-96px)] bg-gray-50 flex justify-center py-10 px-6">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm flex flex-col overflow-hidden h-[75vh]">
                {/* Chat Header */}
                <div className="bg-[#6a0026] text-white p-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Message Thread</h2>
                        <p className="text-sm opacity-80">Connected for Blood Request</p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-white opacity-80 hover:opacity-100"
                    >
                        ← Back
                    </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                    {messages.map((msg, idx) => {
                        const isMe = msg.sender === currentUser._id;
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] px-4 py-2 rounded-xl text-sm ${isMe ? 'bg-black text-white rounded-tr-sm' : 'bg-white border text-gray-800 rounded-tl-sm shadow-sm'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 bg-white border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 p-3 rounded-lg border focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        <button
                            type="submit"
                            className="bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 font-medium transition"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chat;
