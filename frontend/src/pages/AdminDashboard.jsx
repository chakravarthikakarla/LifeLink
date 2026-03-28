import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { User, Users, ClipboardList, Trophy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAvatarColor } from "../utils/getAvatarColor";

const AdminDashboard = () => {
    const { user } = useAuth();
    const profile = user?.profile || {};
    console.log("Admin Profile:", profile);

    const sidebarLinks = [
        { name: "Profile", path: "/admin-dashboard/profile", icon: User },
        { name: "Club Members", path: "/admin-dashboard/members", icon: Users },
        { name: "Donation Records", path: "/admin-dashboard/donations", icon: ClipboardList },
    ];

    const [imgError, setImgError] = useState(false);

    return (
        <div className="flex min-h-[calc(100vh-96px)] bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col fixed h-[calc(100vh-96px)] top-24 left-0 z-10 transition-all">
                <div className="p-6 border-b border-gray-50 flex items-center gap-4">
                    {profile.photo && !imgError ? (
                        <img 
                            src={profile.photo} 
                            alt="Admin" 
                            className="w-12 h-12 rounded-full object-cover border border-gray-100"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm"
                            style={{ backgroundColor: getAvatarColor(profile.name) }}
                        >
                            {profile.name ? profile.name[0].toUpperCase() : "A"}
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-gray-800">{profile.name || "Admin"}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{profile.club || "Club"} Admin</p>
                    </div>
                </div>
                
                <nav className="flex-1 p-6 space-y-3 mt-4">
                    {sidebarLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <NavLink
                                key={link.name}
                                to={link.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-5 py-4 rounded-xl font-medium transition-all ${
                                        isActive
                                            ? "bg-[#6a0026] text-white shadow-lg transform scale-105"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-[#6a0026]"
                                    }`
                                }
                            >
                                <Icon size={20} />
                                <span>{link.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-64 p-4 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminDashboard;
