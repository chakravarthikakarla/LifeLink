const cors = require("cors");

const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);

// Handle multiple origins and strip trailing slashes
const frontendURL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const allowedOrigins = [
  frontendURL,
  "https://lifelink-connect.vercel.app", // Explicitly add production URL
  "http://localhost:5173",
  "http://localhost:5174"
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = origin.replace(/\/$/, "");
  return allowedOrigins.includes(normalizedOrigin);
};


const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps)
      if (!origin) return callback(null, true);
      
      const isAllowed = isOriginAllowed(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Socket origin not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true
});

// app.use(cors({
//   origin: (origin, callback) => {
//     // allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);
    
//     if (allowedOrigins.includes(origin.replace(/\/$/, ""))) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true
// }));

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true
}));


// allow JSON body
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

app.set("io", io);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/blood", require("./routes/bloodRoutes"));
app.use("/api/alerts", require("./routes/alertRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/achievements", require("./routes/achievementRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));



app.get("/", (req, res) => {
  res.send("Life Link Backend is running");
});

// Socket.io connection
io.on("connection", (socket) => {

  // Join a private room for user-specific notifications
  socket.on("join_notifications", (userId) => {
    if (userId) {
      socket.userId = userId.toString();
      socket.join(socket.userId);
    }
  });

  socket.on("join_chat", ({ roomId, userId }) => {
    if (userId) socket.userId = userId.toString();
    socket.join(roomId);
  });

  socket.on("leave_chat", ({ roomId }) => {
    socket.leave(roomId);
  });

  socket.on("send_message", async (data) => {
    try {
      const { bloodRequest, sender, receiver, text, roomId } = data;
      const receiverIdStr = receiver.toString();

      // Check if receiver is currently in the same chat room
      const room = io.sockets.adapter.rooms.get(roomId);
      let isReceiverInRoom = false;
      
      if (room) {
        for (const socketId of room) {
          const s = io.sockets.sockets.get(socketId);
          if (s && s.userId === receiverIdStr) {
            isReceiverInRoom = true;
            break;
          }
        }
      }


      // Save message to database
      const newMessage = new Message({
        bloodRequest,
        sender,
        receiver,
        text,
        isRead: isReceiverInRoom
      });
      const savedMessage = await newMessage.save();

      // Emit to room
      io.to(roomId).emit("receive_message", savedMessage);

      // Notify receiver via their private notification room if they are NOT in the chat
      if (!isReceiverInRoom) {
        io.to(receiverIdStr).emit("notification_update", { 
          type: "message", 
          receiver: receiverIdStr,
          requestId: bloodRequest,
          sender
        });
      }
    } catch (err) {
      console.error("Socket send_message error:", err.message);
      socket.emit("message_error", {
        message: "Failed to send message",
        requestId: data?.bloodRequest,
      });
    }
  });

  socket.on("disconnect", () => {
    // Disconnected
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ 
    message: "Global server error", 
    error: err.message 
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
