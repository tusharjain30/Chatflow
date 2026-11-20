import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ResellerShell } from "@/components/reseller/ResellerShell";
import ProfileTab from "./tabs/ProfileTab";
import CommissionTab from "./tabs/CommissionTab";
import BillingTab from "./tabs/BillingTab";
import InvoiceTab from "./tabs/InvoiceTab";
import NotificationTab from "./tabs/NotificationTab";
import SecurityTab from "./tabs/SecurityTab";
import WhatsAppTab from "./tabs/WhatsAppTab";
import IntegrationsTab from "./tabs/IntegrationsTab";
import { getAuthToken } from "@/utils/authStorage";
import {
  FiBell,
  FiCreditCard,
  FiFileText,
  FiMessageCircle,
  FiPercent,
  FiShield,
  FiUser,
  FiZap,
} from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

const tabs = [
  { key: "profile", label: "Profile", icon: FiUser },
  { key: "commission", label: "Commission", icon: FiPercent },
  { key: "billing", label: "Billing", icon: FiCreditCard },
  { key: "invoice", label: "Invoice", icon: FiFileText },
  { key: "notifications", label: "Notifications", icon: FiBell },
  { key: "security", label: "Security", icon: FiShield },
  { key: "whatsapp", label: "WhatsApp API", icon: FiMessageCircle },
  { key: "integrations", label: "Integrations", icon: FiZap },
];

export type ResellerSettingsProfile = {
  companyName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  commissionRate: number;
  balance: number;
};

type BillingData = {
  summary: {
    walletBalance: number;
    totalProfit: number;
    totalRevenue: number;
    totalRecharge: number;
    activeCustomers: number;
    averageRevenuePerCustomer: number;
    commissionRate: number;
  };
  invoices: Array<{ id: string }>;
  rechargeHistory: Array<{ id: string }>;
};

type EarningsData = {
  monthlyRecurringRevenue: number;
  monthlyCommission: number;
  commissionRate: number;
  totalCustomers: number;
  payouts: Array<{ id: string }>;
};

export default function ResellerSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profile, setProfile] = useState<ResellerSettingsProfile | null>(null);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const { toast } = useToast();
  const { refetchProfile, logout } = useAuth();
  const navigate = useNavigate();

  const loadSettings = async () => {
    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${getAuthToken()}`,
      };

      const [profileResponse, billingResponse, earningsResponse] = await Promise.all([
        fetch(`${API_BASE}/reseller/profile/me`, { headers }),
        fetch(`${API_BASE}/reseller/billing`, { headers }),
        fetch(`${API_BASE}/reseller/earnings`, { headers }),
      ]);

      const [profileJson, billingJson, earningsJson] = await Promise.all([
        profileResponse.json(),
        billingResponse.json(),
        earningsResponse.json(),
      ]);

      if (profileResponse.ok && profileJson.status === 1) {
        setProfile(profileJson.data);
      }

      if (billingResponse.ok && billingJson.status === 1) {
        setBilling(billingJson.data);
      }

      if (earningsResponse.ok && earningsJson.status === 1) {
        setEarnings(earningsJson.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveProfile = async (payload: Partial<ResellerSettingsProfile>) => {
    setSavingProfile(true);
    try {
      const response = await fetch(`${API_BASE}/reseller/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to save settings");
      }

      setProfile(json.data);
      await refetchProfile();
      toast({
        title: "Settings updated",
        description: "Reseller profile settings saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description:
          error instanceof Error ? error.message : "Unable to save settings",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    setSavingPassword(true);
    try {
      const response = await fetch(`${API_BASE}/reseller/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to change password");
      }

      toast({
        title: "Password changed",
        description: "Please login again with your new password.",
      });
      logout();
      navigate("/reseller/login");
    } catch (error) {
      toast({
        title: "Password update failed",
        description:
          error instanceof Error ? error.message : "Unable to change password",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <ResellerShell title="Settings" eyebrow="Manage your account">
      <div className="mt-6 flex flex-col gap-6 xl:flex-row">
        <div className="w-full xl:w-64">
          <div className="space-y-2 rounded-xl border bg-gray-50 p-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all",
                    isActive
                      ? "bg-[#16A249] text-white"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <Icon
                    className={cn(
                      "text-base",
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-gray-600",
                    )}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Card className="flex-1 rounded-xl bg-white">
          <CardContent className="p-6">
            {activeTab === "profile" && (
              <ProfileTab
                loading={loading}
                profile={profile}
                onSave={saveProfile}
                saving={savingProfile}
              />
            )}
            {activeTab === "commission" && (
              <CommissionTab
                loading={loading}
                profile={profile}
                earnings={earnings}
                onSave={saveProfile}
                saving={savingProfile}
              />
            )}
            {activeTab === "billing" && (
              <BillingTab loading={loading} billing={billing} earnings={earnings} />
            )}
            {activeTab === "invoice" && <InvoiceTab loading={loading} billing={billing} />}
            {activeTab === "notifications" && <NotificationTab />}
            {activeTab === "security" && (
              <SecurityTab onSave={changePassword} saving={savingPassword} />
            )}
            {activeTab === "whatsapp" && <WhatsAppTab profile={profile} />}
            {activeTab === "integrations" && <IntegrationsTab />}
          </CardContent>
        </Card>
      </div>
    </ResellerShell>
  );
}
