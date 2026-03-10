import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";

const VerifyOtp = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [verified, setVerified] = useState(false);

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
      const userId = localStorage.getItem("pendingUserId");
      if (!userId) {
        alert("Session expired. Please register again.");
        navigate("/register");
        return;
      }

      const enteredOtp = otp.join("");
      if (enteredOtp.length !== 4) {
        alert("Please enter complete OTP");
        return;
      }

      await axios.post("/auth/verify-otp", {
        userId,
        otp: enteredOtp,
      });

      localStorage.removeItem("pendingUserId");
      setVerified(true);
    } catch (error) {
      alert(error.response?.data?.message || "Invalid OTP");
    }
  };

  // 🔁 RESEND OTP (REAL BACKEND)
  const handleResendOtp = async () => {
    try {
      const userId = localStorage.getItem("pendingUserId");
      if (!userId) {
        alert("Session expired. Please register again.");
        navigate("/register");
        return;
      }

      await axios.post("/auth/resend-otp", { userId });

      setOtp(["", "", "", ""]);
      setTimer(30);
      inputRefs.current[0].focus();
      alert("New OTP sent");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to resend OTP");
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
    localStorage.removeItem("token");
    inputRefs.current[0]?.focus();
  }, []);

  const isOtpIncomplete = otp.some((digit) => digit === "");

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center bg-white">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-sm p-12 text-center">

        {!verified ? (
          <>
            <h2 className="text-2xl font-semibold mb-2">OTP Verification</h2>

            <p className="text-sm text-gray-500 mb-8">
              An OTP has been sent to <br />
              <span className="font-medium">your registered email</span>
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
                  className="
                    w-12 h-12
                    text-center
                    border border-gray-300
                    rounded-lg
                    text-lg
                    focus:outline-none
                    focus:ring-1
                    focus:ring-black
                  "
                />
              ))}
            </div>

            {/* TIMER / RESEND (FIXED POSITION UI) */}
            <div className="mb-6 h-6 flex justify-center items-center">
              <button
                onClick={handleResendOtp}
                disabled={timer > 0}
                className={`text-sm transition-all duration-200
                  ${
                    timer > 0
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
              disabled={isOtpIncomplete}
              className={`px-8 py-3 rounded-lg transition
                ${
                  isOtpIncomplete
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:opacity-90"
                }`}
            >
              Verify & Proceed
            </button>
          </>
        ) : (
          <>
            {/* SUCCESS STATE */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-500 text-white text-2xl mb-6">
                ✓
              </div>

              <h2 className="text-2xl font-semibold mb-2">
                OTP Verified Successfully
              </h2>

              <p className="text-gray-500 mb-8">
                Your email has been verified successfully.
              </p>

              <button
                onClick={() => navigate("/login")}
                className="bg-black text-white px-8 py-3 rounded-lg hover:opacity-90 transition"
              >
                Continue to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyOtp;
