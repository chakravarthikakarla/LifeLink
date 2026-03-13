import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";
import { toast } from "react-hot-toast";

/* Tailwind input class */
const inputClass =
  "w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#6a0026]";

const Details = () => {
  const navigate = useNavigate();

  // FORM STATE (NO UI CHANGE)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: "",
    dob: "",
    age: "",
    bloodGroup: "",
    gender: "",
    lastDonationDate: "",
    availableToDonate: "true",
  });

  const [email, setEmail] = useState("");

  // 🔄 Fetch profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/user/profile");

        setEmail(res.data.email);

        if (res.data.profile) {
          setForm((prev) => ({
            ...prev,
            ...res.data.profile,
            dob: res.data.profile.dob
              ? res.data.profile.dob.slice(0, 10)
              : "",
            lastDonationDate: res.data.profile.lastDonationDate
              ? res.data.profile.lastDonationDate.slice(0, 10)
              : "",
            availableToDonate: res.data.profile.availableToDonate !== false ? "true" : "false",
          }));
        }
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  // Calculate age whenever DOB changes (YOUR LOGIC PRESERVED)
  const handleDobChange = (value) => {
    setForm((prev) => ({ ...prev, dob: value }));

    if (!value) {
      setForm((prev) => ({ ...prev, age: "" }));
      return;
    }

    const birthDate = new Date(value);
    const today = new Date();

    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      calculatedAge--;
    }

    setForm((prev) => ({ ...prev, age: calculatedAge }));
  };

  // Generic input handler
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔐 Submit profile
  const handleSubmit = async () => {
    // Basic Validation
    if (!form.name || !form.phone || !form.address || !form.pincode || !form.dob || !form.bloodGroup || !form.gender) {
      toast.error("Please fill out all required fields.");
      return;
    }
    if (form.phone.length !== 10 || !/^\d+$/.test(form.phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    if (form.pincode.length !== 6 || !/^\d+$/.test(form.pincode)) {
      toast.error("Please enter a valid 6-digit pincode.");
      return;
    }

    try {
      const submitData = {
        ...form,
        availableToDonate: form.availableToDonate === "true",
      };
      await axios.put("/user/profile", submitData);
      toast.success("Profile updated successfully!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="bg-gray-100 min-h-[calc(100vh-96px)] flex items-center justify-center px-4">
      <div className="w-full max-w-5xl rounded-xl overflow-hidden shadow-md bg-white">

        {/* GRADIENT HEADER */}
        <div className="h-24 bg-gradient-to-r from-[#6a0026] to-[#b23a57] flex items-center px-10">
          <h2 className="text-white text-2xl font-semibold">
            Profile Details
          </h2>
        </div>

        {/* FORM CONTENT */}
        <div className="p-10">
          <p className="text-sm text-gray-500 mb-8">
            Please complete your profile to become an active blood donor
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">

            <Field label="Full Name">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Phone Number">
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Email Address">
              <input
                value={email}
                disabled
                className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`}
              />
            </Field>

            <Field label="Address">
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Gender">
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label="Pincode">
              <input
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Date of Birth">
              <input
                type="date"
                value={form.dob}
                onChange={(e) => handleDobChange(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Age">
              <input
                value={form.age}
                disabled
                placeholder="Auto calculated"
                className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`}
              />
            </Field>

            <Field label="Blood Group">
              <select
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select</option>
                <option>O+</option>
                <option>O-</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </Field>

            <Field label="Available to Donate">
              <select
                name="availableToDonate"
                value={form.availableToDonate}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>

            <Field label="Last Donation Date (Optional)">
              <input
                type="date"
                name="lastDonationDate"
                value={form.lastDonationDate}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

          </div>

          {/* SUBMIT */}
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              className="bg-[#6a0026] text-white px-10 py-3 rounded-lg hover:opacity-90 transition"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;

/* Reusable Field Wrapper */
const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    {children}
  </div>
);
