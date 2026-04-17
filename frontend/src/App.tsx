import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import ProtectedRoute from "./utils/ProtectedRoute";
import PublicOnlyRoute from "./utils/PublicOnlyRoute";

import Home from "./pages/public/Home";
import Features from "./pages/public/Features";
import Pricing from "./pages/public/Pricing";
import UseCases from "./pages/public/UseCases";
import Integrations from "./pages/public/Integrations";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

import Index from "./pages/Index";
import Inbox from "./pages/Inbox";
import Contacts from "./pages/Contacts";
import Broadcasts from "./pages/Broadcasts";
import Chatbots from "./pages/Chatbots";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Templates from "./pages/Templates";
import TemplateCreate from "./pages/TemplateCreate";
import Automation from "./pages/Automation";
import TeamMembers from "./pages/TeamMembers";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";
import ResellerLogin from "./pages/reseller/ResellerLogin";
import ResellerDashboard from "./pages/reseller/ResellerDashboard";
import ResellerCustomers from "./pages/reseller/ResellerCustomers";
import ResellerCustomerCreate from "./pages/reseller/ResellerCustomerCreate";
import ResellerCustomerDetail from "./pages/reseller/ResellerCustomerDetail";
import ResellerPlans from "./pages/reseller/ResellerPlans";
import ResellerEarnings from "./pages/reseller/ResellerEarnings";
import ResellerBilling from "./pages/reseller/ResellerBilling";
import ResellerSettings from "./pages/reseller/ResellerSettings";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import PlansManagement from "./pages/admin/PlansManagement";
import MessageLogs from "./pages/admin/MessageLogs";
import PaymentHistory from "./pages/admin/PaymentHistory";
import SystemSettings from "./pages/admin/SystemSettings";
import ContactGroups from "./pages/public/ContactGroups";
import ContactCustomFields from "./pages/public/ContactCustomFields";
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
            <Route path="/contact-groups" element={<ContactGroups />} />
            <Route path="/contact-custom-fields" element={<ContactCustomFields />} />

            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
            <Route
              path="/reseller/login"
              element={
                <PublicOnlyRoute portal="reseller">
                  <ResellerLogin />
                </PublicOnlyRoute>
              }
            />

            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
            <Route path="/templates/preview/:id" element={<TemplatePreviewPage />} />
            <Route path="/broadcasts" element={<ProtectedRoute><Broadcasts /></ProtectedRoute>} />
            <Route path="/chatbots" element={<ProtectedRoute><Chatbots /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/templates/create" element={<ProtectedRoute><TemplateCreate /></ProtectedRoute>} />
            <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><TeamMembers /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
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
              path="/reseller/settings"
              element={
                <ProtectedRoute portal="reseller">
                  <ResellerSettings />
                </ProtectedRoute>
              }
            />

            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/plans" element={<ProtectedRoute><PlansManagement /></ProtectedRoute>} />
            <Route path="/admin/logs" element={<ProtectedRoute><MessageLogs /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><SystemSettings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
