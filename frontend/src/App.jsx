import { Routes, Route } from "react-router-dom";
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

function App() {
  return (
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
  );
}

export default App;
