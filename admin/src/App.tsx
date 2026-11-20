import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import ProtectedRoute from "./utils/ProtectedRoute";
import PublicOnlyRoute from "./utils/PublicOnlyRoute";
import { comingSoonModules } from "./config/adminNav";

import AdminLogin from "./pages/admin/auth/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AnalyticsReports from "./pages/admin/AnalyticsReports";
import PlatformHealth from "./pages/admin/PlatformHealth";
import ResellerManagement from "./pages/admin/ResellerManagement";
import TenantManagement from "./pages/admin/TenantManagement";
import TenantDetail from "./pages/admin/TenantDetail";
import UserManagement from "./pages/admin/UserManagement";
import PlansManagement from "./pages/admin/PlansManagement";
import MessageLogs from "./pages/admin/MessageLogs";
import PaymentHistory from "./pages/admin/PaymentHistory";
import SystemSettings from "./pages/admin/SystemSettings";
import ComingSoonModule from "./pages/admin/ComingSoonModule";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute portal="admin">{children}</ProtectedRoute>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route
              path="/admin/login"
              element={
                <PublicOnlyRoute portal="admin">
                  <AdminLogin />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/login"
              element={<Navigate to="/admin/login" replace />}
            />

            {/* OVERVIEW */}
            <Route
              path="/admin"
              element={
                <ProtectedAdmin>
                  <AdminDashboard />
                </ProtectedAdmin>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedAdmin>
                  <AnalyticsReports />
                </ProtectedAdmin>
              }
            />
            <Route
              path="/admin/health"
              element={
                <ProtectedAdmin>
                  <PlatformHealth />
                </ProtectedAdmin>
              }
            />

            {/* CUSTOMER MANAGEMENT */}
            <Route
              path="/admin/tenants"
              element={
                <ProtectedAdmin>
                  <TenantManagement />
                </ProtectedAdmin>
              }
            />
            <Route
              path="/admin/tenants/:id"
              element={
                <ProtectedAdmin>
                  <TenantDetail />
                </ProtectedAdmin>
              }
            />
            <Route
              path="/admin/resellers"
              element={
                <ProtectedAdmin>
                  <ResellerManagement />
                </ProtectedAdmin>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedAdmin>
                  <UserManagement />
                </ProtectedAdmin>
              }
            />

            {/* WHATSAPP / SAAS / CONFIG mapped existing */}
            <Route
              path="/admin/message-logs"
              element={
                <ProtectedAdmin>
                  <MessageLogs />
                </ProtectedAdmin>
              }
            />
            <Route
              path="/admin/logs"
              element={<Navigate to="/admin/message-logs" replace />}
            />
            <Route
              path="/admin/plans"
              element={
                <ProtectedAdmin>
                  <PlansManagement />
                </ProtectedAdmin>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedAdmin>
                  <PaymentHistory />
                </ProtectedAdmin>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedAdmin>
                  <SystemSettings />
                </ProtectedAdmin>
              }
            />

            {/* Remaining modules — structured shells */}
            {comingSoonModules.map((module) => (
              <Route
                key={module.path}
                path={`/admin/${module.path}`}
                element={
                  <ProtectedAdmin>
                    <ComingSoonModule
                      title={module.title}
                      subtitle={module.subtitle}
                    />
                  </ProtectedAdmin>
                }
              />
            ))}

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
