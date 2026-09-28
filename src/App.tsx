import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import TrackRepair from "./pages/TrackRepair";
import RequestRepair from "./pages/RequestRepair";
import QuoteApproval from "./pages/QuoteApproval";
import Login from "./pages/Login";
import AdminDashboard, { AdminSection } from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminServices from "./pages/AdminServices";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { getRolePath, isProfileRole } from "./lib/auth";

const queryClient = new QueryClient();

function RoleRedirect() {
  const { profile } = useAuth();
  return profile && isProfileRole(profile.role)
    ? <Navigate to={getRolePath(profile.role)} replace />
    : <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/track" element={<TrackRepair />} />
          <Route path="/request" element={<RequestRepair />} />
          <Route path="/quote" element={<QuoteApproval />} />
          <Route path="/login" element={<Login />} />
          <Route path="/staff" element={<Navigate to="/login" replace />} />

          <Route path="/app" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
          <Route path="/app/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
          <Route path="/app/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/app/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
          <Route path="/app/admin/services" element={<ProtectedRoute requiredRole="admin"><AdminServices /></ProtectedRoute>} />
          <Route path="/app/staff" element={<ProtectedRoute requiredRole="staff"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/app/technician" element={<ProtectedRoute requiredRole="technician"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/app/service-requests" element={<ProtectedRoute><AdminSection title="Service Requests" /></ProtectedRoute>} />
          <Route path="/app/customers" element={<ProtectedRoute><AdminSection title="Customers" /></ProtectedRoute>} />
          <Route path="/app/technicians" element={<ProtectedRoute><AdminSection title="Technicians" /></ProtectedRoute>} />
          <Route path="/app/services" element={<ProtectedRoute><AdminSection title="Services & Pricing" /></ProtectedRoute>} />
          <Route path="/app/notifications" element={<ProtectedRoute><AdminSection title="Notifications" /></ProtectedRoute>} />
          <Route path="/app/reports" element={<ProtectedRoute><AdminSection title="Reports" /></ProtectedRoute>} />
          <Route path="/app/settings" element={<ProtectedRoute><AdminSection title="Settings" /></ProtectedRoute>} />
          <Route path="/app/my-repairs" element={<ProtectedRoute><AdminSection title="My Repairs" /></ProtectedRoute>} />
          <Route path="/app/*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
