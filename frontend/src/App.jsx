import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import RequestBlood from "./pages/RequestBlood";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import Details from "./pages/Details";
import Alerts from "./pages/Alerts";
import MyRequests from "./pages/MyRequests";
import Chat from "./pages/Chat";
import AdminDashboard from "./pages/AdminDashboard";
import ClubMembers from "./pages/ClubMembers";
import MemberProfile from "./pages/MemberProfile";
import ClubDonations from "./pages/ClubDonations";
import Achievements from "./pages/Achievements";

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
      <Route path="/about" element={<MainLayout><About /></MainLayout>} />

      {/* 🔐 PROTECTED ROUTES */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout><Dashboard /></MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <MainLayout><AdminDashboard /></MainLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Dashboard />} />
          <Route path="members" element={<ClubMembers />} />
          <Route path="member/:id" element={<MemberProfile />} />
          <Route path="donations" element={<ClubDonations />} />
          <Route path="achievements" element={<div className="p-6"><h1 className="text-3xl font-bold">Achievements</h1></div>} />
        </Route>

      <Route
        path="/request-blood"
        element={
          <ProtectedRoute>
            <MainLayout><RequestBlood /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-requests"
        element={
          <ProtectedRoute>
            <MainLayout><MyRequests /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/details"
        element={
          <ProtectedRoute>
            <MainLayout><Details /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <MainLayout><Alerts /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/achievements"
        element={
          <ProtectedRoute>
            <MainLayout><Achievements /></MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat/:requestId/:donorId"
        element={
          <ProtectedRoute>
            <MainLayout><Chat /></MainLayout>
          </ProtectedRoute>
        }
      />

      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
      <Route path="/register" element={<MainLayout><Register /></MainLayout>} />
      <Route path="/verify-otp" element={<MainLayout><VerifyOtp /></MainLayout>} />
      <Route path="/forgot-password" element={<MainLayout><ForgotPassword /></MainLayout>} />
      </Routes>
    </>
  );
}

export default App;
