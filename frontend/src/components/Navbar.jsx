import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import axios from "../services/api";
import socket from "../socket";
import Modal from "./Modal";

const Navbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!token;
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let isMounted = true;
    const userId = user?.id || user?._id;

    const fetchUnreadCounts = async () => {
      try {
        const [resAlerts, resMessages] = await Promise.all([
          axios.get("/blood/unread-count"),
          axios.get("/chat/unread-count"),
        ]);
        if (!isMounted) return;
        setUnreadAlerts(resAlerts.data.count);
        setUnreadMessages(resMessages.data.count);
      } catch (err) {
        console.error("Failed to fetch unread counts", err);
      }
    };

    const initialFetchTimer = setTimeout(() => {
      fetchUnreadCounts();
    }, 0);

    if (!socket.connected) socket.connect();
    socket.emit("join_notifications", userId);

    const handleNotification = () => {
      fetchUnreadCounts();
    };

    socket.on("notification_update", handleNotification);

    return () => {
      isMounted = false;
      clearTimeout(initialFetchTimer);
      socket.off("notification_update", handleNotification);
    };
  }, [isLoggedIn, user?.id, user?._id]);

  const handleAuthAction = () => {
    if (isLoggedIn) {
      setModalOpen(true);
    } else {
      navigate("/login");
    }
  };

  const confirmLogout = () => {
    logout();
    setModalOpen(false);
    toast.success("Successfully logged out");
  };

  const navLinkClass = ({ isActive }) =>
    `cursor-pointer pb-1 transition-all
     hover:text-[#6a0026]
     ${isActive
      ? "border-b-2 border-black text-[#6a0026]"
      : "text-gray-700"}`;

  return (
    <>
    <nav className="fixed top-0 left-0 w-full z-50
                    flex items-center justify-between
                    px-10 md:px-20 py-5 bg-white/70 backdrop-blur-md
                    border-b border-gray-100/50 shadow-sm transition-all duration-300">

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

      {/* Mobile controls: Alerts Bell and Menu button */}
      <div className="md:hidden flex items-center gap-3">
        {isLoggedIn && (
          <button
            onClick={() => navigate("/alerts")}
            className="p-2 rounded-full hover:bg-gray-100 relative group"
          >
            <Bell className="w-6 h-6 text-gray-700 group-hover:text-[#6a0026]" />
            {(unreadAlerts > 0 || unreadMessages > 0) && (
              <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-600 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
            )}
          </button>
        )}
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
          aria-label="Toggle mobile menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H20" stroke="#6a0026" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Right side */}
      <div className="hidden md:flex items-center gap-4">

        {isLoggedIn && (
          <div className="flex items-center gap-2">
            {/* Alerts Bell */}
            <button
              onClick={() => navigate("/alerts")}
              className="p-2 rounded-full hover:bg-gray-100 relative group"
            >
              <Bell className="w-6 h-6 text-gray-700 group-hover:text-[#6a0026]" />
              {(unreadAlerts > 0 || unreadMessages > 0) && (
                <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-600 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
              )}
            </button>
          </div>
        )}

        <button
          onClick={handleAuthAction}
          className={`flex items-center gap-2 px-6 py-2 border-2 rounded-xl font-medium transition
                     ${isLoggedIn 
                       ? "border-[#6a0026] text-[#6a0026] hover:bg-[#6a0026] hover:text-white" 
                       : "border-black text-black hover:bg-black hover:text-white"}`}
        >
          {isLoggedIn ? <><LogOut size={18} /> Logout</> : "Log In"}
        </button>
      </div>

    </nav>

    {mobileMenu && (
      <div className="md:hidden fixed top-20 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex flex-col p-4 gap-2">
          <NavLink to="/" onClick={() => setMobileMenu(false)} className={navLinkClass}>Home</NavLink>
          <NavLink to="/about" onClick={() => setMobileMenu(false)} className={navLinkClass}>About Us</NavLink>
          <NavLink to="/my-requests" onClick={() => setMobileMenu(false)} className={navLinkClass}>Request Blood</NavLink>
          <NavLink to="/dashboard" onClick={() => setMobileMenu(false)} className={navLinkClass}>Profile</NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin-dashboard" onClick={() => setMobileMenu(false)} className={navLinkClass}>Admin</NavLink>
          )}

          <button
            onClick={() => { setMobileMenu(false); handleAuthAction(); }}
            className="mt-2 w-full text-left px-3 py-2 border border-[#6a0026] rounded-lg text-[#6a0026] font-medium"
          >
            {isLoggedIn ? "Logout" : "Log In"}
          </button>
        </div>
      </div>
    )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Logout Confirmation"
        message="Are you sure you want to log out of LifeLink?"
        type="confirm"
        onConfirm={confirmLogout}
      />
    </>
  );
};

export default Navbar;
