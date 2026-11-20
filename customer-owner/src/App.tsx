import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import ProtectedRoute from "./utils/ProtectedRoute";
import PublicOnlyRoute from "./utils/PublicOnlyRoute";
import { DashboardLayout } from "./components/layouts/DashboardLayout";

import Home from "./pages/public/Home";
import Features from "./pages/public/Features";
import Pricing from "./pages/public/Pricing";
import UseCases from "./pages/public/UseCases";
import Integrations from "./pages/public/Integrations";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import ContactCustomFields from "./pages/public/ContactCustomFields";

import Login from "./pages/customer-owner/auth/Login";
import Signup from "./pages/customer-owner/auth/Signup";
import ForgotPassword from "./pages/customer-owner/auth/ForgotPassword";
import AcceptTeamInvite from "./pages/customer-owner/auth/AcceptTeamInvite";
import Dashboard from "./pages/customer-owner/Dashboard";
import Inbox from "./pages/customer-owner/Inbox";
import Contacts from "./pages/customer-owner/Contacts";
import Broadcasts from "./pages/customer-owner/Broadcasts";
import BroadcastCreate from "./pages/customer-owner/BroadcastCreate";
import Chatbots from "./pages/customer-owner/Chatbots";
import Analytics from "./pages/customer-owner/Analytics";
import DeveloperTools from "./pages/customer-owner/DeveloperTools";
import Settings from "./pages/customer-owner/Settings";
import Help, {
  HelpCreate,
  HelpDetail,
} from "./pages/customer-owner/Help";
import Templates from "./pages/customer-owner/Templates";
import TemplateCreate from "./pages/customer-owner/TemplateCreate";
import Automation from "./pages/customer-owner/Automation";
import TeamMembers from "./pages/customer-owner/TeamMembers";
import Billing from "./pages/customer-owner/Billing";
import Subscription from "./pages/customer-owner/Subscription";
import NotFound from "./pages/NotFound";
import TemplatePreviewPage from "./components/template/TemplatePreviewPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/use-cases" element={<UseCases />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <Signup />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPassword />
                </PublicOnlyRoute>
              }
            />
            <Route path="/team/invite/:token" element={<AcceptTeamInvite />} />

            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route
                path="/contact-groups"
                element={<Navigate to="/contacts?tab=groups" replace />}
              />
              <Route
                path="/contact-custom-fields"
                element={<ContactCustomFields />}
              />
              <Route path="/broadcasts" element={<Broadcasts />} />
              <Route path="/broadcasts/create" element={<BroadcastCreate />} />
              <Route path="/chatbots" element={<Chatbots />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/templates/create" element={<TemplateCreate />} />
              <Route
                path="/templates/preview/:id"
                element={<TemplatePreviewPage />}
              />
              <Route path="/automation" element={<Automation />} />
              <Route path="/team" element={<TeamMembers />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/developer-tools" element={<DeveloperTools />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
              <Route path="/help/create" element={<HelpCreate />} />
              <Route path="/help/:id" element={<HelpDetail />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
