import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "../components/Skeleton";
import axios from "../services/api";
import socket from "../socket";
import { toast } from "react-hot-toast";
import Modal from "../components/Modal";

const CLOSED_REQUEST_VISIBILITY_MS = 24 * 60 * 60 * 1000;

const isVisibleRequest = (request) => {
    if (request?.status !== "closed") return true;
    if (!request?.closedAt) return false;

    return Date.now() - new Date(request.closedAt).getTime() < CLOSED_REQUEST_VISIBILITY_MS;
};

const MyRequests = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: "",
        message: "",
        type: "confirm",
        onConfirm: () => { },
    });
    const [unitsModalOpen, setUnitsModalOpen] = useState(false);
    const [unitsInput, setUnitsInput] = useState("1");
    const [unitsPending, setUnitsPending] = useState({ requestId: null, donorId: null, donorName: "" });

    const fetchRequests = async () => {
        try {
            const res = await axios.get("/blood/my-requests");
            setRequests(res.data.filter(isVisibleRequest));
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedUser = JSON.parse(sessionStorage.getItem("user") || "{}");
        // We use .id consistently as sent by the backend
        const myId = storedUser?.id || storedUser?._id || "";

        if (myId) {
            socket.emit("join_notifications", myId);
        }

        fetchRequests();
        const refreshTimer = setInterval(() => {
            fetchRequests();
        }, 60 * 1000);

        const handleNotification = (data) => {
            const user = JSON.parse(sessionStorage.getItem("user") || "{}");
            const myId = user?.id || user?._id;
            if (data.type === "donor_accepted" && data.receiver === myId) {
                fetchRequests();
            } else if (data.type === "message" && data.receiver === myId) {
                fetchRequests();
            }
        };

        socket.on("notification_update", handleNotification);

        return () => {
            clearInterval(refreshTimer);
            socket.off("notification_update", handleNotification);
        };
    }, []);

    const handleClose = (requestId) => {
        setModalConfig({
            title: "Close Request",
            message: "Are you sure you want to close this blood request? This action cannot be undone.",
            type: "confirm",
            onConfirm: async () => {
                try {
                    await axios.post("/blood/close", { requestId });
                    toast.success("Request closed successfully");
                    fetchRequests();
                    setModalOpen(false);
                } catch (error) {
                    toast.error(error.response?.data?.message || "Failed to close request");
                }
            },
        });
        setModalOpen(true);
    };

    const handleMarkDonationDone = (requestId, donorId, donorName) => {
        setUnitsPending({ requestId, donorId, donorName });
        setUnitsInput("1");
        setUnitsModalOpen(true);
    };

    const handleUnitsSubmit = () => {
        const donatedUnits = Number(unitsInput);
        if (!Number.isFinite(donatedUnits) || donatedUnits <= 0) {
            toast.error("Please enter a valid units value greater than 0");
            return;
        }
        setUnitsModalOpen(false);
        setModalConfig({
            title: "Confirm Donation Done",
            message: `Mark donation as completed with ${donatedUnits} unit(s)?`,
            type: "confirm",
            onConfirm: async () => {
                try {
                    const res = await axios.post("/blood/donation-done", {
                        requestId: unitsPending.requestId,
                        donorId: unitsPending.donorId,
                        donatedUnits,
                    });
                    toast.success(
                        `Updated. Remaining units: ${res.data.remainingUnits}.` +
                        (res.data.renotifySent ? ` Re-notified: ${res.data.renotifySent}` : "")
                    );
                    fetchRequests();
                    setModalOpen(false);
                } catch (error) {
                    toast.error(error.response?.data?.message || "Failed to update donation status");
                }
            },
        });
        setModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-96px)] bg-gray-50 px-6 md:px-20 py-10">
                <div className="flex items-center justify-between mb-10">
                    <Skeleton width="20rem" height="3rem" />
                    <Skeleton width="10rem" height="3rem" />
                </div>
                <div className="space-y-6">
                    <Skeleton height="12rem" className="rounded-xl" />
                    <Skeleton height="12rem" className="rounded-xl" />
                </div>
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
            {requests.filter(isVisibleRequest).length === 0 && (
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
                {requests.filter(isVisibleRequest).map((request) => (
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
                                            <div className="grid bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 uppercase gap-3" style={{gridTemplateColumns: '2rem 2fr 1fr 1.2fr 0.8fr 1.3fr 0.8fr 0.6fr 14rem'}}>
                                                <span className="text-center">#</span>
                                                <span className="text-center">Name</span>
                                                <span className="text-center">Blood Group</span>
                                                <span className="text-center">Phone</span>
                                                <span className="text-center">Gender</span>
                                                <span className="text-center">Accepted At</span>
                                                <span className="text-center">Donation</span>
                                                <span className="text-center">Units</span>
                                                <span className="text-center">Action</span>
                                            </div>

                                            {/* Donor Rows */}
                                            {request.acceptedDonors.map((donor, index) => (
                                                <div
                                                    key={index}
                                                    className="grid px-4 py-3 text-sm border-t items-center gap-3"
                                                    style={{gridTemplateColumns: '2rem 2fr 1fr 1.2fr 0.8fr 1.3fr 0.8fr 0.6fr 14rem'}}
                                                >
                                                    <span className="text-gray-500 text-center">{index + 1}</span>
                                                    <span className="font-medium text-center">{donor.name}</span>
                                                    <span className="text-[#6a0026] font-semibold text-center">
                                                        {donor.bloodGroup}
                                                    </span>
                                                    <span className="text-center">{donor.phone || "-"}</span>
                                                    <span className="text-center">{donor.gender || "-"}</span>
                                                    <span className="text-gray-500 text-xs text-center">
                                                        {new Date(donor.acceptedAt).toLocaleString("en-GB", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                    <span className={`text-xs font-semibold text-center ${donor.donationDone ? "text-green-700" : "text-gray-500"}`}>
                                                        {donor.donationDone ? "Yes" : "No"}
                                                    </span>
                                                    <span className="text-sm text-center">{donor.donatedUnits || "-"}</span>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => navigate(`/chat/${request._id}/${donor._id}`)}
                                                            className="text-[#6a0026] hover:bg-[#6a0026] hover:text-white border border-[#6a0026] px-3 py-1 rounded-md text-xs font-medium transition whitespace-nowrap relative group"
                                                        >
                                                            💬 Chat
                                                            {donor.unreadCount > 0 && (
                                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
                                                            )}
                                                        </button>
                                                        <button
                                                            disabled={request.status !== "active" || donor.donationDone}
                                                            onClick={() => handleMarkDonationDone(request._id, donor._id, donor.name)}
                                                            className={`px-3 py-1 rounded-md text-xs font-medium transition whitespace-nowrap ${request.status !== "active" || donor.donationDone
                                                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                                    : "bg-green-600 text-white hover:bg-green-700"
                                                                }`}
                                                        >
                                                            Donation Done
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Units Input Modal */}
            {unitsModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Enter Donated Units</h3>
                            <button
                                onClick={() => setUnitsModalOpen(false)}
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-4">
                                How many units did <span className="font-semibold text-gray-800">{unitsPending.donorName || "this donor"}</span> donate?
                            </p>
                            <input
                                type="number"
                                min="1"
                                value={unitsInput}
                                onChange={(e) => setUnitsInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleUnitsSubmit()}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6a0026]"
                                autoFocus
                            />
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setUnitsModalOpen(false)}
                                className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUnitsSubmit}
                                className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#6a0026] text-white hover:opacity-90 transition-opacity"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
            />
        </div>
    );
};

export default MyRequests;
