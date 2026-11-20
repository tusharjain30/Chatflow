import { Outlet, Navigate } from "react-router-dom";
import { ArrowLeftRight, ShieldAlert } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function DashboardLayout() {
  const {
    isAuthenticated,
    loading,
    isImpersonatingCustomer,
    restoreSupportSession,
    supportSession,
  } = useAuth();

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F5F6F8]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {isImpersonatingCustomer ? (
          <div className="border-b border-red-200 bg-red-50 px-6 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-white p-2 text-red-600 shadow-sm">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Client support session active for{" "}
                    {supportSession?.customerCompanyName || "client account"}
                  </p>
                  <p className="text-xs text-red-700">
                    You entered from{" "}
                    {supportSession?.originPortal === "admin"
                      ? "super admin"
                      : "reseller"}{" "}
                    panel{" "}
                    {supportSession?.originLabel ||
                      supportSession?.resellerCompanyName ||
                      supportSession?.resellerName ||
                      "Support"}
                    . Use back to dashboard to return without login.
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
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
