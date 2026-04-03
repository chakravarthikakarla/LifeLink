import { useState, useEffect } from "react";
import axios from "../services/api";
import { toast } from "react-hot-toast";
import { Check, X, User as UserIcon, Mail, Home, Shield } from "lucide-react";

const MasterAdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/pending-requests");
      setRequests(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await axios.put(`/admin/approve/${userId}`);
      toast.success("Admin request approved!");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval failed");
    }
  };

  const handleReject = async (userId) => {
    try {
      await axios.put(`/admin/reject/${userId}`);
      toast.success("Admin request rejected.");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-96px)] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a0026]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-92px)] bg-gray-50 py-10 px-4 md:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[#6a0026] rounded-xl text-white shadow-lg">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Master Admin Panel</h1>
            <p className="text-gray-500">Manage and approve club administrator requests</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6 text-gray-300">
               <Shield size={40} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Pending Requests</h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              There are currently no users waiting for admin approval. New requests will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">User Details</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Requested Club</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <UserIcon size={20} />
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
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterAdminDashboard;
