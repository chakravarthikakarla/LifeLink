import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Skeleton from "../components/Skeleton";
import axios from "../services/api";
import { toast } from "react-hot-toast";
import { getAvatarColor } from "../utils/getAvatarColor";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Droplets, User } from "lucide-react";

const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-3 text-gray-500">
            {Icon && <Icon size={18} className="text-gray-400" />}
            <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="font-semibold text-gray-800 text-sm">{value || "-"}</span>
    </div>
);

const MemberProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMemberProfile = async () => {
            try {
                const res = await axios.get(`/user/member-profile/${id}`);
                setMember(res.data);
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to fetch member profile");
                navigate("/admin-dashboard/members");
            } finally {
                setLoading(false);
            }
        };

        fetchMemberProfile();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="p-8 space-y-6 max-w-4xl mx-auto">
                <Skeleton height="10rem" className="rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton height="15rem" className="rounded-2xl" />
                    <Skeleton height="15rem" className="rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!member) return null;

    const profile = member.profile || {};

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto bg-gray-50 min-h-full">
            <button 
                onClick={() => navigate("/admin-dashboard/members")}
                className="flex items-center gap-2 text-gray-500 hover:text-[#6a0026] mb-6 transition-colors font-medium group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Members
            </button>

            <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#6a0026]/5 rounded-full -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#6a0026]/5 rounded-full -ml-12 -mb-12" />
                    
                    <div 
                        className="w-32 h-32 rounded-3xl flex items-center justify-center text-4xl font-bold text-white shadow-xl z-10"
                        style={{ backgroundColor: getAvatarColor(profile.name) }}
                    >
                        {profile.name ? profile.name[0].toUpperCase() : "U"}
                    </div>

                    <div className="text-center md:text-left z-10">
                        <h1 className="text-3xl font-bold text-gray-800">{profile.name || "Anonymous"}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold uppercase tracking-wider">
                                {profile.clubRole || "Member"}
                            </span>
                            {profile.bloodGroup && (
                                <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold flex items-center gap-1 border border-red-100">
                                    <Droplets size={12} />
                                    {profile.bloodGroup}
                                </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                profile.availableToDonate !== false 
                                ? "bg-green-50 text-green-600 border-green-100" 
                                : "bg-orange-50 text-orange-600 border-orange-100"
                            }`}>
                                {profile.availableToDonate !== false ? "Available" : "Unavailable"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <User size={20} className="text-[#6a0026]" />
                            Basic Information
                        </h3>
                        <div className="space-y-1">
                            <InfoRow label="Email" value={member.email} icon={Mail} />
                            <InfoRow label="Phone" value={profile.phone} icon={Phone} />
                            <InfoRow label="Gender" value={profile.gender} />
                            <InfoRow 
                                label="Date of Birth" 
                                value={profile.dob ? new Date(profile.dob).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "-"} 
                                icon={Calendar}
                            />
                            <InfoRow label="Age" value={profile.age ? `${profile.age} years` : "-"} />
                        </div>
                    </div>

                    {/* Address & Other */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <MapPin size={20} className="text-[#6a0026]" />
                            Location & Status
                        </h3>
                        <div className="space-y-1">
                            <InfoRow label="Address" value={profile.address} />
                            <InfoRow label="Pincode" value={profile.pincode} />
                            <InfoRow 
                                label="Last Donation" 
                                value={profile.lastDonationDate ? new Date(profile.lastDonationDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "No records"} 
                            />
                            <InfoRow label="Club" value={profile.club} />
                        </div>
                    </div>
                </div>

                {/* Donation History if any */}
                {member.donationHistory && member.donationHistory.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                         <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Droplets size={20} className="text-[#6a0026]" />
                            Donation History
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <th className="pb-4 px-2">Date</th>
                                        <th className="pb-4 px-2">Units</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {member.donationHistory.map((entry, idx) => (
                                        <tr key={idx} className="text-sm">
                                            <td className="py-4 px-2 font-medium text-gray-700">
                                                {new Date(entry.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </td>
                                            <td className="py-4 px-2 text-gray-600">{entry.units} Units</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberProfile;
