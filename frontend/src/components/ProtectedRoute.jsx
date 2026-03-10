import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../services/api";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const verifyProfile = async () => {
      if (!token) {
        setIsAuthorized(false);
        return;
      }

      try {
        const res = await axios.get("/user/profile");

        // If profile incomplete and not on the details page, block access
        if (!res.data.profileCompleted && location.pathname !== "/details") {
          setIsAuthorized("incomplete");
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Profile verification failed", error);
        localStorage.removeItem("token");
        setIsAuthorized(false);
      }
    };

    verifyProfile();
  }, [token, location.pathname]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Show a blank/loading state while verifying to prevent flash of protected content
  if (isAuthorized === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Redirect to details if profile is incomplete
  if (isAuthorized === "incomplete") {
    return <Navigate to="/details" replace />;
  }

  // Redirect to login if token validation failed
  if (isAuthorized === false) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
