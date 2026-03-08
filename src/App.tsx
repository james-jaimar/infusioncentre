import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
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
import AdminTraining from "./pages/admin/AdminTraining";
import AdminReferrals from "./pages/admin/AdminReferrals";
import AdminFormTemplates from "./pages/admin/AdminFormTemplates";
import AdminBillableItems from "./pages/admin/AdminBillableItems";
import AdminCommunications from "./pages/admin/AdminCommunications";
import AdminTreatmentCourses from "./pages/admin/AdminTreatmentCourses";

// Nurse pages
import NurseLayout from "./components/layout/NurseLayout";
import NurseDashboard from "./pages/nurse/NurseDashboard";
import NurseCommandCentre from "./pages/nurse/NurseCommandCentre";
import NurseTodaysPatients from "./pages/nurse/NurseTodaysPatients";
import NurseCheckIn from "./pages/nurse/NurseCheckIn";
import NurseActiveTreatment from "./pages/nurse/NurseActiveTreatment";
import NurseKetamineMonitoring from "./pages/nurse/NurseKetamineMonitoring";
import NurseDischarge from "./pages/nurse/NurseDischarge";
import NurseEmergency from "./pages/nurse/NurseEmergency";
import NurseJobCard from "./pages/nurse/NurseJobCard";

// Doctor pages
import DoctorLayout from "./components/layout/DoctorLayout";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorReferrals from "./pages/doctor/DoctorReferrals";
import DoctorNewReferral from "./pages/doctor/DoctorNewReferral";
import DoctorPatientView from "./pages/doctor/DoctorPatientView";
import DoctorReportsPage from "./pages/doctor/DoctorReports";
import DoctorPatientProgress from "./pages/doctor/DoctorPatientProgress";
import AdminDoctorReports from "./pages/admin/AdminDoctorReports";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminTenants from "./pages/admin/AdminTenants";

// Platform (super-admin) pages
import PlatformLayout from "./components/layout/PlatformLayout";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import PlatformTenants from "./pages/platform/PlatformTenants";
import PlatformUsers from "./pages/platform/PlatformUsers";
import PlatformSubscriptions from "./pages/platform/PlatformSubscriptions";
import PlatformAuditLog from "./pages/platform/PlatformAuditLog";
import PlatformSettings from "./pages/platform/PlatformSettings";

// Patient pages
import PatientLayout from "./components/layout/PatientLayout";
import PatientDashboard from "./pages/patient/PatientDashboard";
import InviteLanding from "./pages/InviteLanding";
import PendingApproval from "./pages/PendingApproval";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TenantProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionTimeoutWarning />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/iv-training" element={<IVTraining />} />
            <Route path="/anaphylaxis-training" element={<AnaphylaxisTraining />} />
            <Route path="/doctors" element={<Doctors />} />

            {/* Invite route (public) */}
            <Route path="/invite/:token" element={<InviteLanding />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
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
              <Route path="training" element={<AdminTraining />} />
              <Route path="referrals" element={<AdminReferrals />} />
              <Route path="treatment-courses" element={<AdminTreatmentCourses />} />
              <Route path="form-templates" element={<AdminFormTemplates />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="billable-items" element={<AdminBillableItems />} />
              <Route path="communications" element={<AdminCommunications />} />
              <Route path="doctor-reports" element={<AdminDoctorReports />} />
              <Route path="billing" element={<AdminBilling />} />
              <Route path="tenants" element={<AdminTenants />} />
              <Route path="command-centre" element={<NurseCommandCentre />} />
              <Route path="job-card/:appointmentId" element={<NurseJobCard />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Platform super-admin routes */}
            <Route
              path="/platform"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PlatformLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PlatformDashboard />} />
              <Route path="tenants" element={<PlatformTenants />} />
              <Route path="users" element={<PlatformUsers />} />
              <Route path="subscriptions" element={<PlatformSubscriptions />} />
              <Route path="audit-log" element={<PlatformAuditLog />} />
              <Route path="settings" element={<PlatformSettings />} />
            </Route>

            {/* Doctor routes */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <DoctorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DoctorDashboard />} />
              <Route path="referrals" element={<DoctorReferrals />} />
              <Route path="referrals/new" element={<DoctorNewReferral />} />
              <Route path="reports" element={<DoctorReportsPage />} />
              <Route path="patients/:patientId" element={<DoctorPatientView />} />
              <Route path="courses/:courseId" element={<DoctorPatientProgress />} />
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
              <Route index element={<NurseCommandCentre />} />
              <Route path="command-centre" element={<NurseCommandCentre />} />
              <Route path="patients" element={<NurseTodaysPatients />} />
              <Route path="checkin/:appointmentId" element={<NurseCheckIn />} />
              <Route path="treatment/:treatmentId" element={<NurseActiveTreatment />} />
              <Route path="ketamine/:treatmentId" element={<NurseKetamineMonitoring />} />
              <Route path="discharge/:treatmentId" element={<NurseDischarge />} />
              <Route path="treatments" element={<NurseTodaysPatients />} />
              <Route path="job-card/:appointmentId" element={<NurseJobCard />} />
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
      </TenantProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
