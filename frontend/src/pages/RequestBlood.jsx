import { useState } from "react";
import axios from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

/* Shared input style */
const inputClass =
  "w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#6a0026] text-black";

const RequestBlood = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    patientName: "",
    bloodGroup: "",
    units: "",
    address: "",
    phone: "",
    urgency: "Normal",
    requiredDate: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patientName || !form.bloodGroup || !form.units || !form.address || !form.phone || !form.requiredDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (form.phone.length !== 10 || !/^\d+$/.test(form.phone)) {
      toast.error("Please enter a valid 10-digit contact number.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("/blood/request", {
        patientName: form.patientName,
        bloodGroup: form.bloodGroup,
        units: Number(form.units),
        requestAddress: form.address,
        phone: form.phone,
        urgency: form.urgency,
        requiredDate: form.requiredDate,
      });

      const matched = res.data.matchedDonors ?? 0;
      const sent = res.data.emailSent ?? 0;
      const failed = res.data.emailFailed ?? 0;
      toast.success(
        `Blood request submitted successfully!\n${matched > 0
          ? `🔎 ${matched} matching donor(s) found. 📧 Sent: ${sent}${failed > 0 ? `, Failed: ${failed}` : ""}`
          : "ℹ️ No matching donors found right now."}`,
        { duration: 5000 }
      );
      navigate("/my-requests");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-[calc(100vh-96px)] flex items-center justify-center px-4 pt-6 pb-10">
      <div className="w-full max-w-5xl rounded-xl overflow-hidden shadow-md bg-white">

        <div className="h-24 bg-gradient-to-r from-[#6a0026] to-[#b23a57] flex items-center px-10">
          <h2 className="text-white text-2xl font-semibold">
            Request Blood
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          <p className="text-sm text-gray-500 mb-8">
            Fill in the details below. Matching blood donors will be notified automatically.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">

            <Field label="Patient Name">
              <input
                name="patientName"
                value={form.patientName}
                onChange={handleChange}
                placeholder="Full name of the patient"
                className={inputClass}
                required
              />
            </Field>

            <Field label="Blood Group Required">
              <select
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                className={inputClass}
                required
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

            <Field label="Units Required">
              <input
                name="units"
                type="number"
                min="1"
                max="20"
                value={form.units}
                onChange={handleChange}
                placeholder="Number of units"
                className={inputClass}
                required
              />
            </Field>

            <Field label="Contact Number">
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className={inputClass}
                required
              />
            </Field>

            <Field label="Address">
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                placeholder="Hospital / clinic address"
                className={inputClass}
                required
              />
            </Field>

            <Field label="Urgency Level">
              <div className="flex flex-col gap-2 mt-1">
                {["Normal", "Urgent", "Emergency"].map((level) => (
                  <label key={level} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      value={level}
                      checked={form.urgency === level}
                      onChange={handleChange}
                      className="accent-[#6a0026] w-4 h-4"
                    />
                    <span
                      className={`text-sm font-medium ${level === "Emergency"
                          ? "text-red-600"
                          : level === "Urgent"
                            ? "text-orange-500"
                            : "text-green-600"
                        }`}
                    >
                      {level}
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Required Date">
              <input
                name="requiredDate"
                type="date"
                value={form.requiredDate}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </Field>

          </div>

          <div className="mt-10 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-10 py-3 rounded-lg text-white font-semibold transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#6a0026] hover:opacity-90"
                }`}
            >
              {loading ? "Submitting..." : "Submit Request ✓"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestBlood;

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium mb-2 text-gray-700">{label}</label>
    {children}
  </div>
);
