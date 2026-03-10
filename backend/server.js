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
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
  },
});

app.use(cors({
  origin: allowedOrigin,
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



app.get("/", (req, res) => {
  res.send("Life Link Backend is running");
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_chat", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const { bloodRequest, sender, receiver, text, roomId } = data;

      // Save message to database
      const newMessage = new Message({
        bloodRequest,
        sender,
        receiver,
        text,
      });
      const savedMessage = await newMessage.save();

      // Emit to room
      io.to(roomId).emit("receive_message", savedMessage);

      // Emit notification update to receiver
      io.emit("notification_update", { type: "message", receiver });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
