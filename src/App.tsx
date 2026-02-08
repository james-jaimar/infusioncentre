import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";

// Public pages
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import IVTraining from "./pages/IVTraining";
import AnaphylaxisTraining from "./pages/AnaphylaxisTraining";
import Doctors from "./pages/Doctors";
import NotFound from "./pages/NotFound";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Admin pages
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminContacts from "./pages/admin/AdminContacts";

// Nurse pages
import NurseLayout from "./components/layout/NurseLayout";
import NurseDashboard from "./pages/nurse/NurseDashboard";

// Patient pages
import PatientLayout from "./components/layout/PatientLayout";
import PatientDashboard from "./pages/patient/PatientDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SessionTimeoutWarning />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/iv-training" element={<IVTraining />} />
            <Route path="/anaphylaxis-training" element={<AnaphylaxisTraining />} />
            <Route path="/doctors" element={<Doctors />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="contacts" element={<AdminContacts />} />
              <Route path="patients" element={<div className="p-4">Patients - Coming Soon</div>} />
              <Route path="appointments" element={<div className="p-4">Appointments - Coming Soon</div>} />
              <Route path="staff" element={<div className="p-4">Staff Management - Coming Soon</div>} />
              <Route path="training" element={<div className="p-4">Training Bookings - Coming Soon</div>} />
              <Route path="reports" element={<div className="p-4">Reports - Coming Soon</div>} />
              <Route path="settings" element={<div className="p-4">Settings - Coming Soon</div>} />
            </Route>

            {/* Nurse routes */}
            <Route
              path="/nurse"
              element={
                <ProtectedRoute allowedRoles={["nurse", "admin"]}>
                  <NurseLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<NurseDashboard />} />
              <Route path="patients" element={<div className="p-4">Today's Patients - Coming Soon</div>} />
              <Route path="treatments" element={<div className="p-4">Active Treatments - Coming Soon</div>} />
              <Route path="emergency" element={<div className="p-4">Emergency Protocol - Coming Soon</div>} />
            </Route>

            {/* Patient routes */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PatientDashboard />} />
              <Route path="appointments" element={<div className="p-4">My Appointments - Coming Soon</div>} />
              <Route path="records" element={<div className="p-4">My Records - Coming Soon</div>} />
              <Route path="profile" element={<div className="p-4">My Profile - Coming Soon</div>} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
