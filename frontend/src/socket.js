import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: false // We will connect manually when needed or rely on component mount
});

export default socket;
