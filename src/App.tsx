import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
              {/* Placeholder routes for future pages */}
              <Route path="patients" element={<div className="p-4">Patients - Coming Soon</div>} />
              <Route path="appointments" element={<div className="p-4">Appointments - Coming Soon</div>} />
              <Route path="staff" element={<div className="p-4">Staff Management - Coming Soon</div>} />
              <Route path="training" element={<div className="p-4">Training Bookings - Coming Soon</div>} />
              <Route path="reports" element={<div className="p-4">Reports - Coming Soon</div>} />
              <Route path="settings" element={<div className="p-4">Settings - Coming Soon</div>} />
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
