import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "../services/api";

const VerifyOtp = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false); // Added loading state

  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // 🔢 Handle OTP input
  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  // ⬅️ Backspace navigation
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // ✅ VERIFY OTP (REAL BACKEND)
  const handleVerify = async () => {
    try {
      setLoading(true); // Set loading to true
      const userId = sessionStorage.getItem("pendingUserId");
      if (!userId) {
        toast.error("Session expired. Please register again."); // Changed alert to toast
        navigate("/register");
        return;
      }

      const enteredOtp = otp.join("");
      if (enteredOtp.length !== 4) {
        toast.error("Please enter complete OTP"); // Changed alert to toast
        return;
      }

      await axios.post("/auth/verify-otp", {
        userId,
        otp: enteredOtp,
      });

      sessionStorage.removeItem("pendingUserId");
      toast.success("Email verified! You can now login.");
      
      // Delay navigation slightly to let the user see the success toast
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP"); // Changed alert to toast
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  // 🔁 RESEND OTP (REAL BACKEND)
  const handleResendOtp = async () => {
    try {
      const userId = sessionStorage.getItem("pendingUserId");
      if (!userId) {
        toast.error("Session expired. Please register again."); // Changed alert to toast
        navigate("/register");
        return;
      }

      await axios.post("/auth/resend-otp", { userId });

      setOtp(["", "", "", ""]);
      setTimer(30);
      inputRefs.current[0].focus();
      toast.success("New OTP sent!"); // Changed alert to toast
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP"); // Changed alert to toast
    }
  };

  // ⏱️ Countdown timer
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // 🔐 Clear any existing token on OTP page load
  useEffect(() => {
    sessionStorage.removeItem("token");
    inputRefs.current[0]?.focus();
  }, []);

  const isOtpIncomplete = otp.some((digit) => digit === "");

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-8 shadow-sm">

        <h2 className="text-2xl font-semibold text-center mb-6 text-black">
          OTP Verification
        </h2>

        <p className="text-sm text-gray-500 mb-6 text-center">
          We&apos;ve sent a 4-digit code to <br />
          <span className="font-medium text-black">your registered email</span>
        </p>

        {/* OTP INPUTS */}
        <div className="flex justify-center gap-4 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-12 text-center border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-1 focus:ring-black"
            />
          ))}
        </div>

        {/* TIMER / RESEND */}
        <div className="mb-6 h-6 flex justify-center items-center">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={timer > 0}
            className={`text-sm transition-all duration-200
              ${timer > 0
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:underline"
              }`}
          >
            {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
          </button>
        </div>

        {/* VERIFY BUTTON */}
        <button
          onClick={handleVerify}
          disabled={isOtpIncomplete || loading}
          className={`w-full py-2 rounded-md transition font-semibold
            ${isOtpIncomplete || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-black text-white hover:opacity-90"
            }`}
        >
          {loading ? "Verifying..." : "Verify & Proceed"}
        </button>

        <p className="text-sm text-center mt-6">
          Wrong email?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Back to Register
          </span>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
