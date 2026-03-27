import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";
import { User, Search, Mail, Phone, ChevronRight, UserMinus, Trash2 } from "lucide-react";
import { getAvatarColor } from "../utils/getAvatarColor";
import Skeleton from "../components/Skeleton";
import { toast } from "react-hot-toast";
import Modal from "../components/Modal";

const ClubMembers = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await axios.get("/user/club-members");
                setMembers(res.data);
            } catch (error) {
                console.error("Failed to fetch members", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, []);

    const handleRemoveMemberClick = (e, member) => {
        e.stopPropagation();
        setMemberToRemove(member);
        setIsModalOpen(true);
    };

    const confirmRemoveMember = async () => {
        if (!memberToRemove) return;

        try {
            const res = await axios.put(`/user/remove-member/${memberToRemove._id}`);
            toast.success(res.data.message || "Member removed successfully");
            setMembers(prev => prev.filter(m => m._id !== memberToRemove._id));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove member");
        } finally {
            setIsModalOpen(false);
            setMemberToRemove(null);
        }
    };

    const filteredMembers = members.filter(member => 
        member.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton height="3rem" className="rounded-xl w-64" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} height="4rem" className="rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Club Members</h1>
                    <p className="text-gray-500 mt-1">Manage and view all members of your club</p>
                </div>
                
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search members..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6a0026] focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Member</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Contact</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Blood Group</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map((member) => (
                                    <tr 
                                        key={member._id} 
                                        className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/admin-dashboard/member/${member._id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div 
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                                                    style={{ backgroundColor: getAvatarColor(member.profile?.name) }}
                                                >
                                                    {member.profile?.name ? member.profile.name[0].toUpperCase() : "U"}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-800 group-hover:text-[#6a0026] transition-colors">
                                                        {member.profile?.name || "Anonymous"}
                                                    </div>
                                                    <div className="text-xs text-gray-500 uppercase tracking-tighter">
                                                        {member.profile?.clubRole || "Member"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail size={14} className="text-gray-400" />
                                                    {member.email}
                                                </div>
                                                {member.profile?.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone size={14} className="text-gray-400" />
                                                        {member.profile.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            {member.profile?.bloodGroup ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                    {member.profile.bloodGroup}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Not set</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-[#6a0026] transition-colors p-2 rounded-lg hover:bg-gray-100"
                                                    title="View Profile"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleRemoveMemberClick(e, member)}
                                                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                                                    title="Remove Member"
                                                >
                                                    <UserMinus size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <User size={48} className="opacity-20" />
                                            <p>No members found matching your search</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmRemoveMember}
                title="Remove Member"
                message={`Are you sure you want to remove ${memberToRemove?.profile?.name || "this member"} from the club? This action cannot be undone.`}
            />
        </div>
    );
};

export default ClubMembers;
