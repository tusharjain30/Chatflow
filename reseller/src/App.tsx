import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import ProtectedRoute from "./utils/ProtectedRoute";
import PublicOnlyRoute from "./utils/PublicOnlyRoute";

import ResellerLogin from "./pages/reseller/auth/ResellerLogin";
import ResellerDashboard from "./pages/reseller/ResellerDashboard";
import ResellerCustomers from "./pages/reseller/ResellerCustomers";
import ResellerCustomerCreate from "./pages/reseller/ResellerCustomerCreate";
import ResellerCustomerDetail from "./pages/reseller/ResellerCustomerDetail";
import ResellerPlans from "./pages/reseller/ResellerPlans";
import ResellerEarnings from "./pages/reseller/ResellerEarnings";
import ResellerBilling from "./pages/reseller/ResellerBilling";
import ResellerCampaigns from "./pages/reseller/ResellerCampaigns";
import ResellerTemplates from "./pages/reseller/ResellerTemplates";
import ResellerContacts from "./pages/reseller/ResellerContacts";
import ResellerContactGroups from "./pages/reseller/ResellerContactGroups";
import ResellerAuditLogs from "./pages/reseller/ResellerAuditLogs";
import ResellerTeam from "./pages/reseller/ResellerTeam";
import ResellerTeamList from "./pages/reseller/ResellerTeamList";
import ResellerSettings from "./pages/reseller/ResellerSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/reseller" replace />} />
            <Route
              path="/reseller/login"
              element={
                <PublicOnlyRoute portal="reseller">
                  <ResellerLogin />
                </PublicOnlyRoute>
              }
            />
            <Route path="/login" element={<Navigate to="/reseller/login" replace />} />

            <Route
              path="/reseller"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/customers"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerCustomers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/customers/:id"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerCustomerDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/customers/new"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerCustomerCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/campaigns"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerCampaigns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/templates"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/contacts"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerContacts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/contact-groups"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerContactGroups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/plans"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerPlans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/earnings"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerEarnings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/billing"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerBilling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/team"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerTeam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/team/list"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerTeamList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/audit"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reseller/settings"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerSettings />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
