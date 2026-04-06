import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Skeleton from "../components/Skeleton";
import { AlertCircle, CheckCircle } from "lucide-react";

const AdminRequestHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState("checking"); // checking, redirecting, error
  const [message, setMessage] = useState("");

  const requestId = searchParams.get("viewRequestId");
  const masterAdminEmail = import.meta.env.VITE_MASTER_ADMIN_EMAIL;

  useEffect(() => {
    // If no request ID, redirect to home
    if (!requestId) {
      navigate("/");
      return;
    }

    // Check authentication
    if (!isAuthenticated || !user) {
      // Not logged in - redirect to login with redirect back to admin dashboard
      setStatus("checking");
      setMessage("Redirecting to login...");
      const timer = setTimeout(() => {
        navigate(`/login?redirect=${encodeURIComponent(`/master-admin?tab=adminRequests&requestId=${requestId}`)}`);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Check if user is Master Admin
    if (user?.email !== masterAdminEmail) {
      // Not Master Admin - redirect to home
      setStatus("error");
      setMessage("You don't have permission to access admin requests. Only Master Admin can view requests.");
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000);
      return () => clearTimeout(timer);
    }

    // User is authenticated and is Master Admin - redirect to admin dashboard with focus on the specific request
    setStatus("redirecting");
    setMessage("Loading admin dashboard...");
    const timer = setTimeout(() => {
      navigate(`/master-admin?tab=adminRequests&requestId=${requestId}`);
    }, 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, requestId, navigate, masterAdminEmail]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center">
        {status === "checking" || status === "redirecting" ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16">
                <Skeleton className="w-full h-full rounded-full" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#6a0026] animate-spin"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Processing Request</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#6a0026] animate-pulse"></div>
            </div>
          </>
        ) : status === "error" ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 rounded-full p-4">
                <AlertCircle size={40} className="text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-3">Access Denied</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-[#6a0026] text-white py-2 rounded-lg font-semibold hover:bg-[#5a0020] transition"
            >
              Go to Home
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle size={40} className="text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-3">Success!</h2>
            <p className="text-gray-600">Redirecting to admin dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminRequestHandler;
