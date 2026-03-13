import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import axios from "../services/api";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await axios.post("/auth/login", {
        email,
        password,
      });

      login(res.data.token, res.data.user);
      toast.success("Welcome back!");

      if (!res.data.profileCompleted) {
        navigate("/details");
      } else {
        navigate("/");
      }

    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center bg-white">
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-8 shadow-sm">

        <h2 className="text-2xl font-semibold text-center mb-6 text-black">
          Sign in to LifeLink
        </h2>


        <form onSubmit={handleLogin}>

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
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <span
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-600 cursor-pointer hover:underline"
              >
                Forgot password?
              </span>
            </div>

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
            {loading ? "Signing in..." : "Sign in"}
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
                  mode: "login",
                });

                login(res.data.token, res.data.user);
                toast.success("Login successful with Google!");

                if (!res.data.profileCompleted) {
                  navigate("/details");
                } else {
                  navigate("/");
                }
              } catch (err) {
                toast.error(err.response?.data?.message || "Google login failed.");
              } finally {
                setLoading(false);
              }
            }}
            onError={() => {
              toast.error("Google login failed. Please try again.");
            }}
          />
        </div>

        <p className="text-sm text-center">
          New to LifeLink?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-blue-600 cursor-pointer"
          >
            Create an account
          </span>
        </p>

      </div>
    </div>
  );
};

export default Login;
