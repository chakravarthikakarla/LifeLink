import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("/auth/register", {
        email,
        password,
      });

      sessionStorage.setItem("pendingUserId", res.data.userId);
      toast.success("Registration successful! Verify OTP.");
      navigate("/verify-otp");

    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center bg-white">
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-8 shadow-sm">

        <h2 className="text-2xl font-semibold text-center mb-6 text-black">
          Sign up for LifeLink
        </h2>


        <form onSubmit={handleRegister}>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md transition font-semibold
              ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black text-white hover:opacity-90"
              }`}
          >
            {loading ? "Registering..." : "Get OTP"}
          </button>
        </form>

        <div className="my-6 border-t border-gray-300"></div>

        {/* Google Sign-in Button */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                setLoading(true);
                const res = await axios.post("/auth/google", {
                  tokenId: credentialResponse.credential,
                  mode: "register",
                });

                toast.success(res.data.message || "Registration successful! Please login.");
                navigate("/login");
              } catch (err) {
                toast.error(err.response?.data?.message || "Google registration failed.");
              } finally {
                setLoading(false);
              }
            }}
            onError={() => {
              toast.error("Google registration failed. Please try again.");
            }}
            text="signup_with"
            useOneTap
          />
        </div>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Log in
          </span>
        </p>

      </div>
    </div>
  );
};

export default Register;
