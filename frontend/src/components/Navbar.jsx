import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, MessageCircle } from "lucide-react";
import axios from "../services/api";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000");

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  const fetchUnreadCounts = async () => {
    if (!isLoggedIn) return;
    try {
      const resAlerts = await axios.get("/blood/unread-count");
      setUnreadAlerts(resAlerts.data.count);
    } catch (err) {
      console.error("Failed to fetch unread counts", err);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();

    if (isLoggedIn) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user._id;

      socket.on("notification_update", (data) => {
        if (data.receiver === userId) {
          fetchUnreadCounts();
        }
      });
    }

    return () => {
      socket.off("notification_update");
    };
  }, [isLoggedIn]);

  const handleAuthAction = () => {
    if (isLoggedIn) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("user");
      navigate("/"); // ✅ logout → home
    } else {
      navigate("/login");
    }
  };

  const navLinkClass = ({ isActive }) =>
    `cursor-pointer pb-1 transition-all
     hover:text-[#6a0026]
     ${isActive
      ? "border-b-2 border-black text-[#6a0026]"
      : "text-gray-700"}`;

  return (
    <nav className="fixed top-0 left-0 w-full z-50
                    flex items-center justify-between
                    px-10 md:px-20 py-6 bg-white
                    border-b border-gray-100 transition-colors duration-300">

      {/* Logo */}
      <div
        className="text-3xl font-bold text-[#6a0026] cursor-pointer"
        onClick={() => navigate("/")}
      >
        LifeLink
      </div>

      {/* Nav Links */}
      <ul className="hidden md:flex gap-8 font-medium">
        <NavLink to="/" className={navLinkClass}>Home</NavLink>
        <NavLink to="/about" className={navLinkClass}>About Us</NavLink>
        <NavLink to="/my-requests" className={navLinkClass}>Request Blood</NavLink>
        <NavLink to="/dashboard" className={navLinkClass}>Profile</NavLink>
      </ul>

      {/* Right side */}
      <div className="flex items-center gap-4">

        {isLoggedIn && (
          <div className="flex items-center gap-2">
            {/* Alerts Bell */}
            <button
              onClick={() => navigate("/alerts")}
              className="p-2 rounded-full hover:bg-gray-100 relative group"
            >
              <Bell className="w-6 h-6 text-gray-700 group-hover:text-[#6a0026]" />
              {unreadAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-600 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
              )}
            </button>
          </div>
        )}

        <button
          onClick={handleAuthAction}
          className="px-6 py-2 border-2 border-black rounded-xl
                     text-black hover:bg-black hover:text-white transition"
        >
          {isLoggedIn ? "Logout" : "Log In"}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
