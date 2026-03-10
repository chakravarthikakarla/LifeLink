import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";

const MyRequests = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await axios.get("/blood/my-requests");
            setRequests(res.data);
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleClose = async (requestId) => {
        const confirm = window.confirm("Are you sure you want to close this request?");
        if (!confirm) return;

        try {
            await axios.post("/blood/close", { requestId });
            fetchRequests();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to close request");
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-96px)] flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-96px)] bg-gray-50 px-6 md:px-20 py-10">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-bold">Blood Requests</h1>
                    <p className="text-gray-500 mt-1">
                        Manage your blood requests and view donor responses
                    </p>
                </div>

                <button
                    onClick={() => navigate("/request-blood")}
                    className="bg-[#6a0026] text-white px-8 py-3 rounded-xl hover:opacity-90 transition font-medium"
                >
                    + Request Blood
                </button>
            </div>

            {/* NO REQUESTS */}
            {requests.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-16 text-center">
                    <div className="text-6xl mb-4">🩸</div>
                    <h3 className="text-xl font-semibold mb-2">No Blood Requests Yet</h3>
                    <p className="text-gray-500 mb-6">
                        When you need blood, click the button above to create a request.
                        Verified donors will be notified instantly.
                    </p>
                    <button
                        onClick={() => navigate("/request-blood")}
                        className="bg-black text-white px-8 py-3 rounded-xl hover:opacity-90 transition"
                    >
                        Create Your First Request
                    </button>
                </div>
            )}

            {/* REQUEST CARDS */}
            <div className="space-y-6">
                {requests.map((request) => (
                    <div
                        key={request._id}
                        className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                        {/* Card Header */}
                        <div
                            className={`px-6 py-4 flex items-center justify-between ${request.status === "active"
                                ? "bg-gradient-to-r from-[#6a0026] to-[#b23a57]"
                                : "bg-gray-400"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <h3 className="text-white text-lg font-semibold">
                                    {request.bloodGroup} Blood Request
                                </h3>
                                <span
                                    className={`text-xs px-3 py-1 rounded-full font-medium ${request.urgency === "Emergency"
                                        ? "bg-red-100 text-red-700"
                                        : request.urgency === "Urgent"
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-green-100 text-green-700"
                                        }`}
                                >
                                    {request.urgency}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-white/80 text-sm">
                                    {new Date(request.createdAt).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                                {request.status === "active" && (
                                    <button
                                        onClick={() => handleClose(request._id)}
                                        className="bg-white/20 text-white text-xs px-3 py-1 rounded-lg hover:bg-white/30 transition"
                                    >
                                        Close Request
                                    </button>
                                )}
                                {request.status === "closed" && (
                                    <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-lg">
                                        Closed
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6">
                            {/* Request Details */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 text-sm">
                                <div>
                                    <span className="text-gray-500">Patient Name</span>
                                    <p className="font-medium">{request.patientName || "-"}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Units Required</span>
                                    <p className="font-medium">{request.units ?? "-"}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Required By</span>
                                    <p className="font-medium">
                                        {request.requiredDate
                                            ? new Date(request.requiredDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                            : "-"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Phone</span>
                                    <p className="font-medium">{request.phone}</p>
                                </div>
                                <div className="md:col-span-4">
                                    <span className="text-gray-500">Address</span>
                                    <p className="font-medium">{request.requestAddress}</p>
                                </div>
                            </div>

                            {/* Accepted Donors */}
                            <div>
                                <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                                    <span>Accepted Donors</span>
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                                        {request.acceptedDonors?.length || 0}
                                    </span>
                                </h4>

                                {(!request.acceptedDonors ||
                                    request.acceptedDonors.length === 0) && (
                                        <p className="text-gray-400 text-sm">
                                            No donors have accepted yet. Hang tight!
                                        </p>
                                    )}

                                {request.acceptedDonors &&
                                    request.acceptedDonors.length > 0 && (
                                        <div className="border rounded-lg overflow-hidden">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-7 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                                                <span>#</span>
                                                <span>Name</span>
                                                <span>Blood Group</span>
                                                <span>Phone</span>
                                                <span>Gender</span>
                                                <span>Accepted At</span>
                                                <span>Action</span>
                                            </div>

                                            {/* Donor Rows */}
                                            {request.acceptedDonors.map((donor, index) => (
                                                <div
                                                    key={index}
                                                    className="grid grid-cols-7 px-4 py-3 text-sm border-t items-center"
                                                >
                                                    <span className="text-gray-500">{index + 1}</span>
                                                    <span className="font-medium">{donor.name}</span>
                                                    <span className="text-[#6a0026] font-semibold">
                                                        {donor.bloodGroup}
                                                    </span>
                                                    <span>{donor.phone || "-"}</span>
                                                    <span>{donor.gender || "-"}</span>
                                                    <span className="text-gray-500 text-xs">
                                                        {new Date(donor.acceptedAt).toLocaleString("en-GB", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                    <button
                                                        onClick={() => navigate(`/chat/${request._id}/${donor._id}`)}
                                                        className="text-[#6a0026] hover:bg-[#6a0026] hover:text-white border border-[#6a0026] px-3 py-1 rounded-md text-xs font-medium transition whitespace-nowrap relative group"
                                                    >
                                                        💬 Chat
                                                        {donor.unreadCount > 0 && (
                                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyRequests;
