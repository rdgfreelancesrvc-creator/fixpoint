import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TrackRepair from "./pages/TrackRepair";
import RequestRepair from "./pages/RequestRepair";
import QuoteApproval from "./pages/QuoteApproval";
import AdminDashboard, { AdminSection } from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
          <Route path="/staff" element={<AdminDashboard />} />
          <Route path="/app" element={<AdminDashboard />} />
          <Route path="/app/dashboard" element={<AdminDashboard />} />
          <Route path="/app/service-requests" element={<AdminSection title="Service Requests" />} />
          <Route path="/app/customers" element={<AdminSection title="Customers" />} />
          <Route path="/app/technicians" element={<AdminSection title="Technicians" />} />
          <Route path="/app/services" element={<AdminSection title="Services & Pricing" />} />
          <Route path="/app/notifications" element={<AdminSection title="Notifications" />} />
          <Route path="/app/reports" element={<AdminSection title="Reports" />} />
          <Route path="/app/settings" element={<AdminSection title="Settings" />} />
          <Route path="/app/my-repairs" element={<AdminSection title="My Repairs" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
