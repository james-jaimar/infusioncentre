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
import AdminPatients from "./pages/admin/AdminPatients";
import PatientNew from "./pages/admin/PatientNew";
import PatientDetail from "./pages/admin/PatientDetail";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AppointmentNew from "./pages/admin/AppointmentNew";
import AppointmentDetail from "./pages/admin/AppointmentDetail";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminReports from "./pages/admin/AdminReports";

// Nurse pages
import NurseLayout from "./components/layout/NurseLayout";
import NurseDashboard from "./pages/nurse/NurseDashboard";
import NurseTodaysPatients from "./pages/nurse/NurseTodaysPatients";
import NurseCheckIn from "./pages/nurse/NurseCheckIn";
import NurseActiveTreatment from "./pages/nurse/NurseActiveTreatment";
import NurseKetamineMonitoring from "./pages/nurse/NurseKetamineMonitoring";
import NurseDischarge from "./pages/nurse/NurseDischarge";
import NurseEmergency from "./pages/nurse/NurseEmergency";

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
              <Route path="patients" element={<AdminPatients />} />
              <Route path="patients/new" element={<PatientNew />} />
              <Route path="patients/:id" element={<PatientDetail />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="appointments/new" element={<AppointmentNew />} />
              <Route path="appointments/:id" element={<AppointmentDetail />} />
              <Route path="staff" element={<AdminStaff />} />
              <Route path="training" element={<div className="p-4">Training Bookings - Coming Soon</div>} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
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
              <Route path="patients" element={<NurseTodaysPatients />} />
              <Route path="checkin/:appointmentId" element={<NurseCheckIn />} />
              <Route path="treatment/:treatmentId" element={<NurseActiveTreatment />} />
              <Route path="ketamine/:treatmentId" element={<NurseKetamineMonitoring />} />
              <Route path="discharge/:treatmentId" element={<NurseDischarge />} />
              <Route path="treatments" element={<NurseTodaysPatients />} />
              <Route path="emergency" element={<NurseEmergency />} />
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
