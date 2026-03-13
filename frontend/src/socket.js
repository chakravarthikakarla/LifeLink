import { io } from "socket.io-client";

const getSocketURL = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
    return apiUrl.replace(/\/api\/?$/, "") || "http://localhost:5000";
};

const SOCKET_URL = getSocketURL();

const socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: false // We will connect manually when needed or rely on component mount
});

export default socket;
