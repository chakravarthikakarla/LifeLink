import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Skeleton from "./Skeleton";
import axios from "../services/api";

const ProtectedRoute = ({ children }) => {
  const { token, logout } = useAuth();
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
        // Allow /alerts even with incomplete profile so new users can view requests
        if (!res.data.profileCompleted && location.pathname !== "/details" && location.pathname !== "/alerts") {
          setIsAuthorized("incomplete");
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Profile verification failed", error);
        logout();
        setIsAuthorized(false);
      }
    };

    verifyProfile();
  }, [token, location.pathname, logout]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show a skeleton state while verifying to prevent flash of protected content
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-20">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton height="3rem" width="40%" />
          <Skeleton height="20rem" />
        </div>
      </div>
    );
  }

  // Redirect to details if profile is incomplete
  if (isAuthorized === "incomplete") {
    return <Navigate to="/details" replace />;
  }

  // Redirect to login if token validation failed
  if (isAuthorized === false) {
     return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
