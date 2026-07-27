import { Sidebar } from '@/components/dashboard/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ArrowLeftRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const {
    isAuthenticated,
    isImpersonatingCustomer,
    restoreSupportSession,
    supportSession,
  } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {isImpersonatingCustomer ? (
          <div className="border-b border-red-200 bg-red-50 px-6 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-white p-2 text-red-600 shadow-sm">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Client support session active for {supportSession?.customerCompanyName || "client account"}
                  </p>
                  <p className="text-xs text-red-700">
                    You entered from {supportSession?.originPortal === "admin" ? "super admin" : "reseller"} panel {supportSession?.originLabel || supportSession?.resellerCompanyName || supportSession?.resellerName || "Support"}. Use back to dashboard to return without login.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-red-300 bg-white text-red-700 hover:bg-red-100 hover:text-red-800 md:w-auto"
                onClick={restoreSupportSession}
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Back to dashboard
              </Button>
            </div>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
