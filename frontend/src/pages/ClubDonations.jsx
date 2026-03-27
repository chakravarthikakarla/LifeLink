import { useState, useEffect } from "react";
import axios from "../services/api";
import Skeleton from "../components/Skeleton";
import { Droplets, Calendar, User, Mail, Search } from "lucide-react";

const ClubDonations = () => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchDonations = async () => {
            try {
                const res = await axios.get("/user/club-donations");
                setDonations(res.data);
            } catch (error) {
                console.error("Failed to fetch donations", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDonations();
    }, []);

    const filteredDonations = donations.filter(donation => 
        donation.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.memberEmail.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h1 className="text-3xl font-bold text-gray-800">Donation Records</h1>
                    <p className="text-gray-500 mt-1">Track all blood donations made by your club members</p>
                </div>
                
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by member..." 
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
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Donor</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Blood Group</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Units</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredDonations.length > 0 ? (
                                filteredDonations.map((donation, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <Calendar size={16} className="text-gray-400" />
                                                {new Date(donation.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800">{donation.memberName}</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Mail size={12} />
                                                    {donation.memberEmail}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {donation.bloodGroup ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                    {donation.bloodGroup}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1 font-bold text-[#6a0026]">
                                                <Droplets size={16} />
                                                {donation.units} Units
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Droplets size={48} className="opacity-20" />
                                            <p>No donation records found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClubDonations;
