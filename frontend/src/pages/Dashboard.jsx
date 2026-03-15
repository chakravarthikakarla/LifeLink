import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "../components/Skeleton";
import axios from "../services/api";
import { toast } from "react-hot-toast";
import Modal from "../components/Modal";

const AboutRow = ({ label, value }) => (
  <div className="flex justify-between py-2">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-right">
      {value || "-"}
    </span>
  </div>
);

const HistoryRow = ({ date, units }) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{date || "-"}</span>
    <span className="font-medium">{units || "-"}</span>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "confirm",
    onConfirm: () => { },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/user/profile");
        setUser(res.data);
      } catch {
        sessionStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  if (!user) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-96px)] px-6 md:px-14 pt-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <Skeleton height="6rem" className="rounded-xl" />
            <Skeleton height="20rem" className="rounded-xl" />
          </div>
          <div className="space-y-5">
            <Skeleton height="15rem" className="rounded-xl" />
            <Skeleton height="15rem" className="rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const profile = user.profile || {};

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-96px)] px-6 md:px-14 pt-6 pb-8">

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* LEFT SECTION (75%) */}
        <div className="lg:col-span-3 space-y-5">

          {/* PROFILE HEADER */}
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt="Profile"
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200 cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-xl font-semibold cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                  >
                    {profile.name ? profile.name[0] : "U"}
                  </div>
                )}
                <div
                  className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg cursor-pointer transition-opacity text-xs font-medium"
                  onClick={() => setShowImageModal(true)}
                >
                  View
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  {profile.name || "Your Name"}
                </h2>
              </div>
            </div>

            <button
              onClick={() => navigate("/details")}
              className="bg-black text-white px-4 py-2 rounded-lg text-sm"
            >
              Edit Profile
            </button>
          </div>

          {/* IMAGE MODAL (WhatsApp Style) */}
          {showImageModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="relative max-w-sm w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">Profile Image</h3>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Image Display */}
                <div className="flex justify-center bg-gray-50 p-6 min-h-[300px] items-center">
                  {profile.photo ? (
                    <img
                      src={profile.photo}
                      alt="Profile Large"
                      className="max-w-full max-h-[400px] object-contain shadow-lg rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-full bg-gray-200 flex items-center justify-center text-6xl font-bold text-gray-400">
                      {profile.name ? profile.name[0] : "U"}
                    </div>
                  )}
                </div>

                {/* Footer Options */}
                <div className="flex border-t divide-x">
                  <button
                    onClick={() => document.getElementById('profile-upload-input').click()}
                    className="flex-1 py-4 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit
                  </button>
                  {profile.photo && (
                    <button
                      onClick={() => {
                        setModalConfig({
                          title: "Remove Photo",
                          message: "Are you sure you want to remove your profile photo?",
                          type: "confirm",
                          onConfirm: async () => {
                            try {
                              const res = await axios.put("/user/profile", { photo: "" });
                              setUser({ ...user, profile: res.data.user.profile });
                              setShowImageModal(false);
                              setModalOpen(false);
                              toast.success("Image removed successfully");
                            } catch (err) {
                              console.error("Photo removal failed", err);
                              toast.error("Failed to remove photo.");
                            }
                          },
                        });
                        setModalOpen(true);
                      }}
                      className="flex-1 py-4 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  id="profile-upload-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("File size should be less than 5MB");
                      return;
                    }

                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = async () => {
                      const base64Photo = reader.result;
                      try {
                        const res = await axios.put("/user/profile", { photo: base64Photo });
                        setUser({ ...user, profile: res.data.user.profile });
                        setShowImageModal(false);
                        toast.success("Image uploaded successfully");
                      } catch (err) {
                        console.error("Photo upload failed", err);
                        toast.error("Failed to upload photo.");
                      }
                    };
                  }}
                />
              </div>
            </div>
          )}

          {/* ABOUT SECTION */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-md font-semibold mb-4">About</h3>

            <div className="divide-y text-sm">
              <AboutRow label="Full Name" value={profile.name} />
              <AboutRow label="Email" value={user.email} />
              <AboutRow label="Gender" value={profile.gender} />
              <AboutRow
                label="DOB"
                value={profile.dob ? profile.dob.slice(0, 10) : ""}
              />
              <AboutRow label="Age" value={profile.age !== undefined && profile.age !== "" ? `${profile.age} yrs` : ""} />
              <AboutRow label="Blood Group" value={profile.bloodGroup} />
              <AboutRow label="Phone Number" value={profile.phone} />
              <AboutRow label="Address" value={profile.address} />
              <AboutRow
                label="Last Donation Date"
                value={profile.lastDonationDate ? profile.lastDonationDate.slice(0, 10) : ""}
              />
              <AboutRow
                label="Available to Donate"
                value={profile.availableToDonate !== false ? "Yes" : "No"}
              />
            </div>
          </div>

        </div>

        {/* RIGHT SECTION (25%) */}
        <div className="space-y-5">

          {/* DONATION HISTORY */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-md font-semibold mb-4">Donation History</h3>

            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Date</span>
              <span>Blood Units</span>
            </div>

            <div className="space-y-2 text-sm">
              {user.donationHistory && user.donationHistory.length > 0 ? (
                user.donationHistory.map((entry, index) => (
                  <HistoryRow
                    key={index}
                    date={entry.date ? new Date(entry.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                    units={entry.units}
                  />
                ))
              ) : (
                <p className="text-gray-400 text-sm">No donation history yet</p>
              )}
            </div>
          </div>

          {/* CALENDAR */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-md font-semibold mb-3">
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                <span key={d} className="font-medium text-gray-500">
                  {d}
                </span>
              ))}

              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }, (_, i) => (
                <span
                  key={i}
                  className={`py-1 rounded-md ${i + 1 === new Date().getDate()
                    ? "bg-[#6a0026] text-white"
                    : "text-gray-600"
                    }`}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>

        </div>
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

export default Dashboard;
