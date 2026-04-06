import { useState, useEffect } from "react";
import axios from "../services/api";
import { toast } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import Modal from "../components/Modal";
import { 
  Check, X, User as UserIcon, Mail, Home, Shield, BarChart3, Users, 
  Building2, ChevronRight, Search, ArrowLeft, Droplets, Phone, MapPin,
  Calendar, LogOut 
} from "lucide-react";
import { getAvatarColor } from "../utils/getAvatarColor";
import Skeleton from "../components/Skeleton";

// InfoRow component for consistent styling
const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-3 text-gray-500">
      {Icon && <Icon size={18} className="text-gray-400" />}
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="font-semibold text-gray-800 text-sm">{value || "-"}</span>
  </div>
);

const MasterAdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [requests, setRequests] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAction, setSelectedAction] = useState("");
  
  // Clubs view state
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubMembers, setClubMembers] = useState([]);
  const [clubMembersLoading, setClubMembersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // User profile state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  
  // Users without club state
  const [usersWithoutClub, setUsersWithoutClub] = useState([]);
  const [usersWithoutClubLoading, setUsersWithoutClubLoading] = useState(false);
  const [searchTermNoClub, setSearchTermNoClub] = useState("");

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle query parameters (tab and requestId from email link)
  useEffect(() => {
    const tab = searchParams.get("tab");
    const requestId = searchParams.get("requestId");
    
    if (tab === "adminRequests") {
      setActiveTab("adminRequests");
      // If requestId is provided, highlight that specific request
      if (requestId && requests.length > 0) {
        const request = requests.find(r => r._id === requestId);
        if (request) {
          setSelectedRequest(requestId);
        }
      }
    }
  }, [searchParams, requests]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [reqRes, clubsRes, statsRes] = await Promise.all([
        axios.get("/admin/pending-requests"),
        axios.get("/admin/clubs"),
        axios.get("/admin/dashboard-stats")
      ]);
      setRequests(reqRes.data);
      setClubs(clubsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchClubMembers = async (clubName) => {
    try {
      setClubMembersLoading(true);
      const res = await axios.get(`/admin/club/${clubName}/members`);
      setClubMembers(res.data);
      setSelectedClub(clubName);
      setSearchTerm("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch members");
    } finally {
      setClubMembersLoading(false);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      setUserLoading(true);
      const res = await axios.get(`/admin/user/${userId}/profile`);
      setSelectedUser(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch user profile");
    } finally {
      setUserLoading(false);
    }
  };

  const fetchUsersWithoutClub = async () => {
    try {
      setUsersWithoutClubLoading(true);
      const res = await axios.get("/admin/users-without-club");
      setUsersWithoutClub(res.data);
      setSearchTermNoClub("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setUsersWithoutClubLoading(false);
    }
  };

  const openConfirm = (userId, action) => {
    setSelectedRequest(userId);
    setSelectedAction(action);
    setConfirmOpen(true);
  };

  const handleApprove = (userId) => openConfirm(userId, "approve");
  const handleReject = (userId) => openConfirm(userId, "reject");

  const handleConfirmAction = async () => {
    try {
      if (selectedAction === "approve") {
        await axios.put(`/admin/approve/${selectedRequest}`);
        toast.success("Admin request approved!");
      } else if (selectedAction === "reject") {
        await axios.put(`/admin/reject/${selectedRequest}`);
        toast.success("Admin request rejected.");
      }
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setConfirmOpen(false);
      setSelectedRequest(null);
      setSelectedAction("");
    }
  };

  const filteredMembers = clubMembers.filter(member =>
    member.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !stats) {
    return (
      <div className="min-h-[calc(100vh-96px)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a0026]"></div>
      </div>
    );
  }

  // Dashboard Tab
  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalUsers || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">No Club Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.usersWithoutClub || 0}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <UserIcon size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pendingAdmins || 0}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Approved Admins</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.approvedAdmins || 0}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Clubs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{clubs?.length || 0}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <Building2 size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Club Distribution */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 size={20} className="text-[#6a0026]" />
          Club Distribution
        </h2>
        <div className="space-y-3">
          {stats?.clubDistribution?.map((club) => (
            <div key={club.club} className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">{club.club}</span>
              <span className="text-2xl font-bold text-[#6a0026]">{club.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Admin Requests Tab
  const AdminRequestsTab = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {requests.length === 0 ? (
        <div className="p-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6 text-gray-300">
            <Shield size={40} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Pending Requests</h2>
          <p className="text-gray-500">All admin requests have been reviewed.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">User Details</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Requested Club</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: getAvatarColor(req.profile?.name) }}
                      >
                        {req.profile?.name ? req.profile.name[0].toUpperCase() : "U"}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{req.profile?.name || "Pending Profile"}</div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Mail size={14} />
                          {req.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-[#6a0026] rounded-full text-sm font-medium border border-red-100/50">
                      <Home size={14} />
                      {req.profile?.club}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleReject(req._id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        <X size={18} />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req._id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#6a0026] text-white hover:opacity-90 rounded-lg shadow-sm transition"
                      >
                        <Check size={18} />
                        Approve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Clubs Tab
  const ClubsTab = () => {
    if (selectedClub) {
      return <ClubMembersView clubName={selectedClub} />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <div
            key={club.name}
            onClick={() => fetchClubMembers(club.name)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-lg hover:border-[#6a0026]/20 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#6a0026]/10 rounded-xl group-hover:bg-[#6a0026]/20 transition">
                <Home size={24} className="text-[#6a0026]" />
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-[#6a0026] transition" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{club.name}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Total Members</span>
                <span className="font-bold text-gray-900">{club.memberCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Admins</span>
                <span className="font-bold text-gray-900">{club.adminCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Club Members View
  const ClubMembersView = ({ clubName }) => (
    <div className="space-y-4">
      <button
        onClick={() => setSelectedClub(null)}
        className="flex items-center gap-2 text-gray-500 hover:text-[#6a0026] mb-6 transition-colors font-medium group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Clubs
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{clubName} Members</h1>
          <p className="text-gray-500 mt-1">View and manage club members</p>
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

      {clubMembersLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} height="4rem" className="rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Member</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Blood Group</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Role</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: getAvatarColor(member.profile?.name) }}
                          >
                            {member.profile?.name ? member.profile.name[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{member.profile?.name || "Anonymous"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell text-gray-600 text-sm">{member.email}</td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        {member.profile?.bloodGroup ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                            {member.profile.bloodGroup}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {member.profile?.clubRole || "Member"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => fetchUserProfile(member._id)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-[#6a0026] transition-colors p-2 rounded-lg hover:bg-gray-100"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <UserIcon size={48} className="opacity-20" />
                        <p>No members found matching your search</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // Users Without Club Tab
  const UsersWithoutClubTab = () => {
    const filteredUsers = usersWithoutClub.filter(user =>
      user.profile?.name?.toLowerCase().includes(searchTermNoClub.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTermNoClub.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Users Without Club</h1>
            <p className="text-gray-500 mt-1">View and manage users not in any club</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6a0026] focus:border-transparent transition-all"
              value={searchTermNoClub}
              onChange={(e) => setSearchTermNoClub(e.target.value)}
            />
          </div>
        </div>

        {usersWithoutClubLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} height="4rem" className="rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">User</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Blood Group</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: getAvatarColor(user.profile?.name) }}
                            >
                              {user.profile?.name ? user.profile.name[0].toUpperCase() : "U"}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{user.profile?.name || "Anonymous"}</div>
                              <div className="text-xs text-gray-500">No Club</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell text-gray-600 text-sm">{user.email}</td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {user.profile?.bloodGroup ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                              {user.profile.bloodGroup}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Not set</span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            user.profile?.availableToDonate !== false
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-orange-50 text-orange-700 border-orange-100"
                          }`}>
                            {user.profile?.availableToDonate !== false ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => fetchUserProfile(user._id)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-[#6a0026] transition-colors p-2 rounded-lg hover:bg-gray-100"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <UserIcon size={48} className="opacity-20" />
                          <p>No users found without a club or matching your search</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // User Profile View
  if (selectedUser) {
    return <MasterUserProfile user={selectedUser} onBack={() => setSelectedUser(null)} />;
  }

  return (
    <div className="min-h-[calc(100vh-92px)] bg-gray-50 py-10 px-4 md:px-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[#6a0026] rounded-xl text-white shadow-lg">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Master Admin Panel</h1>
            <p className="text-gray-500">Manage clubs, admins, and users</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "requests", label: "Admin Requests", icon: Shield },
            { id: "clubs", label: "Clubs", icon: Building2 },
            { id: "no-club", label: "Users Without Club", icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedClub(null);
                  if (tab.id === "no-club") {
                    fetchUsersWithoutClub();
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#6a0026] text-white shadow-lg"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-[#6a0026]/30"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "requests" && <AdminRequestsTab />}
          {activeTab === "clubs" && <ClubsTab />}
          {activeTab === "no-club" && <UsersWithoutClubTab />}
        </div>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        title={selectedAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
        message={
          selectedAction === "approve"
            ? "Are you sure you want to approve this admin request?"
            : "Are you sure you want to reject this admin request?"
        }
        type="confirm"
      />
    </div>
  );
};

// Master User Profile Component
const MasterUserProfile = ({ user, onBack }) => {
  const profile = user.profile || {};

  return (
    <div className="min-h-[calc(100vh-92px)] bg-gray-50 py-10 px-4 md:px-20">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
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
                {profile.club && (
                  <span className="px-3 py-1 bg-[#6a0026]/10 text-[#6a0026] rounded-full text-xs font-semibold uppercase tracking-wider border border-[#6a0026]/20">
                    {profile.club}
                  </span>
                )}
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

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <UserIcon size={20} className="text-[#6a0026]" />
                Basic Information
              </h3>
              <div className="space-y-1">
                <InfoRow label="Email" value={user.email} icon={Mail} />
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

            {/* Address & Medical Info */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MapPin size={20} className="text-[#6a0026]" />
                Location & Medical
              </h3>
              <div className="space-y-1">
                <InfoRow label="Address" value={profile.address} />
                <InfoRow label="Pincode" value={profile.pincode} />
                <InfoRow label="Blood Group" value={profile.bloodGroup} />
                <InfoRow 
                  label="Last Donation" 
                  value={profile.lastDonationDate ? new Date(profile.lastDonationDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "No records"} 
                  icon={Droplets}
                />
                <InfoRow label="Club" value={profile.club !== "none" ? profile.club : "Not assigned"} icon={Home} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Icons that need to be imported
const Clock = ({ size }) => <Calendar size={size} className="text-yellow-600" />;
const CheckCircle = ({ size }) => <Check size={size} className="text-green-600" />;

export default MasterAdminDashboard;
