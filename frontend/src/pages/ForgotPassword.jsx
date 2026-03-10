import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "../services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP, 3 = New Password

  // State for step 1
  const [email, setEmail] = useState("");

  // State for step 2
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);
  const [timer, setTimer] = useState(30);

  // State for step 3
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ... (keeping other handlers the same for brevity initially, but modifying handleResetPassword)

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await axios.post("/auth/forgot-password", { email });
      setStep(2);
      setTimer(30);
      setSuccessMsg("OTP sent to your email");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP Input Handlers (similar to VerifyOtp)
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const handleVerifyOtpSubmit = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 4) {
      setError("Please enter the complete 4-digit OTP");
      return;
    }
    setError("");
    setStep(3); // We verify the OTP at the final stage to avoid making two endpoints, or we can just proceed to step 3 and verify at the end.
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const enteredOtp = otp.join("");

      await axios.post("/auth/reset-password", {
        email,
        otp: enteredOtp,
        newPassword
      });

      setSuccessMsg("Password reset successfully. Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-8 shadow-sm">

        <h2 className="text-2xl font-semibold text-center mb-6 text-black">
          {step === 1 && "Forgot Password"}
          {step === 2 && "Enter OTP"}
          {step === 3 && "Create New Password"}
        </h2>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        {successMsg && (
          <p className="text-green-600 text-sm mb-4 text-center">{successMsg}</p>
        )}

        {/* STEP 1: EMAIL INPUT */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Enter your registered email address and we'll send you an OTP to reset your password.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Enter your email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-md transition font-semibold
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white hover:opacity-90"}`}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
            <p className="text-sm text-center mt-6">
              Remember your password?{" "}
              <span onClick={() => navigate("/login")} className="text-blue-600 cursor-pointer hover:underline">
                Back to Login
              </span>
            </p>
          </form>
        )}

        {/* STEP 2: OTP INPUT */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtpSubmit}>
            <p className="text-sm text-gray-500 mb-6 text-center">
              We've sent a 4-digit code to <br />
              <span className="font-medium text-black">{email}</span>
            </p>

            <div className="flex justify-center gap-4 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  className="w-12 h-12 text-center border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-1 focus:ring-black"
                />
              ))}
            </div>

            <div className="mb-6 h-6 flex justify-center items-center">
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={timer > 0 || loading}
                className={`text-sm transition-all duration-200
                  ${timer > 0 || loading ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:underline"}`}
              >
                {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
              </button>
            </div>

            <button
              type="submit"
              disabled={otp.some(d => d === "")}
              className={`w-full py-2 rounded-md transition font-semibold
                ${otp.some(d => d === "") ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white hover:opacity-90"}`}
            >
              Verify OTP
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Please enter your new password below.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-md transition font-semibold
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white hover:opacity-90"}`}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
