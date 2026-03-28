import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";
import Modal from "../components/Modal";
import socket from "../socket";

const CLOSED_REQUEST_VISIBILITY_MS = 24 * 60 * 60 * 1000;

const isVisibleAlert = (alert) => {
  const request = alert?.bloodRequest;

  if (!request) return false;
  if (request.status !== "closed") return true;
  if (!request.closedAt) return false;

  return Date.now() - new Date(request.closedAt).getTime() < CLOSED_REQUEST_VISIBILITY_MS;
};

const Alerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "confirm",
    onConfirm: () => { },
  });

  // 🔔 Fetch alerts
  const fetchAlerts = async () => {
    try {
      const res = await axios.get("/alerts");
      setAlerts(res.data.filter(isVisibleAlert));
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(sessionStorage.getItem("user") || "{}");
    const myId = storedUser?.id || storedUser?._id || "";

    if (myId) {
      socket.emit("join_notifications", myId);
    }

    const initialFetchTimer = setTimeout(() => {
      fetchAlerts();
    }, 0);
    const refreshTimer = setInterval(() => {
      fetchAlerts();
    }, 60 * 1000);

    // Mark alerts as viewed (Navbar dot clearance)
    const markAsViewed = async () => {
      try {
        await axios.post("/blood/mark-viewed");
      } catch (err) {
        console.error("Failed to mark alerts as viewed", err);
      }
    };
    markAsViewed();

    const handleNotification = (data) => {
      if (data.type === "message" || data.type === "alert") {
        fetchAlerts();
      }
    };

    socket.on("notification_update", handleNotification);

    return () => {
      clearTimeout(initialFetchTimer);
      clearInterval(refreshTimer);
      socket.off("notification_update", handleNotification);
    };
  }, []);

  // ✅ Accept alert
  const handleAccept = (alertId) => {
    setModalConfig({
      title: "Accept Request",
      message: "Are you sure you want to accept this emergency blood request?",
      type: "confirm",
      onConfirm: async () => {
        try {
          await axios.post("/alerts/accept", { alertId });
          fetchAlerts();
          setModalOpen(false);
        } catch (err) {
          console.error("Failed to accept alert", err);
          setModalConfig({
            title: "Error",
            message: err.response?.data?.message || "Failed to accept the alert. Please try again.",
            type: "alert",
          });
          setModalOpen(true);
        }
      },
    });
    setModalOpen(true);
  };

  // ❌ Reject alert
  const handleReject = (alertId) => {
    setModalConfig({
      title: "Reject Request",
      message: "Are you sure you want to reject this emergency blood request?",
      type: "confirm",
      onConfirm: async () => {
        try {
          await axios.post("/alerts/reject", { alertId });
          fetchAlerts();
          setModalOpen(false);
        } catch (err) {
          console.error("Failed to reject alert", err);
          setModalConfig({
            title: "Error",
            message: err.response?.data?.message || "Failed to reject the alert. Please try again.",
            type: "alert",
          });
          setModalOpen(true);
        }
      },
    });
    setModalOpen(true);
  };

  return (
    <div className="min-h-[calc(100vh-96px)] bg-gray-50 px-10 md:px-20 py-10 pt-32">
      <h2 className="text-2xl font-semibold mb-8 text-black">
        Emergency Blood Alerts
      </h2>

      <div className="space-y-6">
        {alerts.filter(isVisibleAlert).map((alert) => {
          const request = alert.bloodRequest;

          // 🔑 Get logged-in user id from token payload (backend sends this)
          const myId = alert._myId;

          const accepted =
            alert.acceptedDonors?.some(
              (d) => d.user?.toString() === myId || d.toString() === myId
            );

          const rejected =
            alert.rejectedDonors?.some(
              (id) => id.toString() === myId
            );

            const isClosed = request?.status === "closed";

            return (
              <div
                key={alert._id}
                className={`rounded-xl shadow-sm p-6 flex justify-between items-start transition-all
                  ${rejected || (isClosed && !accepted)
                    ? "bg-gray-100 opacity-70 grayscale-[0.5]"
                    : isClosed && accepted
                      ? "bg-gray-100 border border-gray-200"
                      : "bg-white border border-gray-100"}`}
              >
              {/* LEFT */}
              <div className="space-y-2 text-black">
                <h3 className="text-xl font-bold uppercase">
                  Blood Request
                </h3>

                <p className="text-gray-600 max-w-xl">
                  {request?.requestAddress}
                </p>

                <div className="flex flex-wrap gap-6 mt-3 text-sm">
                  <p>
                    <span className="font-medium">Patient:</span>{" "}
                    {request?.patientName || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Blood Group:</span>{" "}
                    <span className="font-semibold text-[#6a0026]">{request?.bloodGroup}</span>
                  </p>
                  <p>
                    <span className="font-medium">Units:</span>{" "}
                    {request?.units ?? "-"} / {request?.totalUnits || request?.units || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Required By:</span>{" "}
                    {request?.requiredDate
                      ? new Date(request.requiredDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                      : "-"}
                  </p>
                  <p>
                    <span className="font-medium">Urgency:</span>{" "}
                    <span
                      className={
                        request?.urgency === "Emergency"
                          ? "text-red-600 font-semibold"
                          : request?.urgency === "Urgent"
                            ? "text-orange-500 font-semibold"
                            : "text-green-600 font-semibold"
                      }
                    >
                      {request?.urgency}
                    </span>
                  </p>
                </div>

                {/* ✅ AFTER ACCEPT */}
                {accepted && (
                  <div className="mt-3 text-sm space-y-1 text-gray-700">
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {request?.phone || "Not provided"}
                    </p>
                  </div>
                )}

                {/* ❌ REJECTED LABEL */}
                {rejected && !accepted && !isClosed && (
                  <p className="text-sm font-semibold text-gray-600 mt-2">
                    Rejected
                  </p>
                )}

                {/* 🏁 CLOSED LABEL */}
                {isClosed && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-700 px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wider border border-gray-300">
                      🔒 Request Closed
                    </span>
                    {!accepted && !rejected && (
                      <span className="text-xs text-gray-500 italic">This request reached its limit or was cancelled.</span>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT */}
              <div className="flex flex-col gap-3 min-w-[110px] items-end">
                {accepted ? (
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg font-semibold text-sm
                      ${isClosed 
                        ? "bg-gray-200 text-gray-500" 
                        : "bg-green-100 text-green-700"}`}>
                      ✓ Accepted
                    </span>
                    {!isClosed && (
                      <button
                        onClick={() => navigate(`/chat/${request._id}/${myId}`)}
                        className="text-[#6a0026] hover:bg-[#6a0026] hover:text-white border border-[#6a0026] px-4 py-1.5 rounded-lg text-sm font-medium transition relative group"
                      >
                        💬 Chat
                        {alert.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
                        )}
                      </button>
                    )}
                  </div>
                ) : rejected ? (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-4 py-2 rounded-lg font-semibold text-sm">
                    ✗ Rejected
                  </span>
                ) : isClosed ? (
                   <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-semibold text-sm italic">
                    Closed
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleAccept(alert._id)}
                      className="px-6 py-2 rounded-lg transition font-semibold bg-black text-white hover:opacity-90"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => handleReject(alert._id)}
                      className="border border-black px-6 py-2 rounded-lg text-black hover:bg-black hover:text-white transition"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <p className="text-gray-500 text-center">
            No alerts available
          </p>
        )}
      </div>

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

export default Alerts;
