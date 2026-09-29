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
import Setup from "./pages/Setup";
import SetupComplete from "./pages/SetupComplete";
import AdminDashboard, { AdminSection } from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminServices from "./pages/AdminServices";
import AdminRequests, { AdminRequestDetail } from "./pages/AdminRequests";
import AdminTechnicians from "./pages/AdminTechnicians";
import { TechnicianDashboard, TechnicianRepairDetail, TechnicianRepairs } from "./pages/TechnicianWorkspace";
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

function RequestAccessGate({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile?.role === "technician") return <Navigate to="/app/technician" replace />;
  if (profile?.role === "admin" || profile?.role === "staff") return children;
  return <Navigate to="/login" replace />;
}

function AdminStaffAccessGate({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile?.role === "admin" || profile?.role === "staff") return children;
  if (profile?.role === "technician") return <Navigate to="/app/technician" replace />;
  return <Navigate to="/login" replace />;
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
          <Route path="/setup" element={<Setup />} />
          <Route path="/setup/complete" element={<SetupComplete />} />
          <Route path="/staff" element={<Navigate to="/login" replace />} />

          <Route path="/app" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
          <Route path="/app/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
          <Route path="/app/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/app/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
          <Route path="/app/admin/services" element={<ProtectedRoute requiredRole="admin"><AdminServices /></ProtectedRoute>} />
          <Route path="/app/staff" element={<ProtectedRoute requiredRole="staff"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/app/technician" element={<ProtectedRoute requiredRole="technician"><TechnicianDashboard /></ProtectedRoute>} />
          <Route path="/app/my-repairs/:requestId" element={<ProtectedRoute requiredRole="technician"><TechnicianRepairDetail /></ProtectedRoute>} />
          <Route path="/app/my-repairs" element={<ProtectedRoute requiredRole="technician"><TechnicianRepairs /></ProtectedRoute>} />
          <Route path="/app/requests/:requestId" element={<ProtectedRoute><RequestAccessGate><AdminRequestDetail /></RequestAccessGate></ProtectedRoute>} />
          <Route path="/app/requests" element={<ProtectedRoute><RequestAccessGate><AdminRequests /></RequestAccessGate></ProtectedRoute>} />
          <Route path="/app/service-requests" element={<Navigate to="/app/requests" replace />} />
          <Route path="/app/customers" element={<ProtectedRoute><AdminSection title="Customers" /></ProtectedRoute>} />
          <Route path="/app/technicians" element={<ProtectedRoute><AdminStaffAccessGate><AdminTechnicians /></AdminStaffAccessGate></ProtectedRoute>} />
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
