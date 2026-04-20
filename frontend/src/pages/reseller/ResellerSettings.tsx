import { useState } from "react";
import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// TAB COMPONENTS (we'll define below)
import ProfileTab from "./tabs/ProfileTab";
import CommissionTab from "./tabs/CommissionTab";
import BillingTab from "./tabs/BillingTab";
import TeamTab from "./tabs/TeamTab";
import NotificationTab from "./tabs/NotificationTab";
import SecurityTab from "./tabs/SecurityTab";
import { Smartphone } from "lucide-react";
import WhatsAppTab from "./tabs/WhatsAppTab";
import {
  FiUser,
  FiPercent,
  FiCreditCard,
  FiUsers,
  FiBell,
  FiShield,
} from "react-icons/fi";
import { FiMessageCircle } from "react-icons/fi";

const tabs = [
  { key: "profile", label: "Profile", icon: FiUser },
  { key: "commission", label: "Commission", icon: FiPercent },
  { key: "billing", label: "Billing", icon: FiCreditCard },
  { key: "team", label: "Team", icon: FiUsers },
  { key: "notifications", label: "Notifications", icon: FiBell },
  { key: "security", label: "Security", icon: FiShield },
  { key: "whatsapp", label: "WhatsApp API", icon: FiMessageCircle },
];

export default function ResellerSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <ResellerShell title="Settings" eyebrow="Manage your account">
      <div className="flex gap-6 mt-6">
        {/* SIDEBAR */}
        <div className="w-64 space-y-2 bg-gray-50 p-4 border rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "group flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
                  isActive
                    ? "bg-[#16A249] text-white"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                {/* ICON */}
                <Icon
                  className={cn(
                    "text-base",
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-600",
                  )}
                />

                {/* LABEL */}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        <Card className="flex-1 bg-white rounded-xl">
          <CardContent className="p-6">
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "commission" && <CommissionTab />}
            {activeTab === "billing" && <BillingTab />}
            {activeTab === "team" && <TeamTab />}
            {activeTab === "notifications" && <NotificationTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "whatsapp" && <WhatsAppTab />}
          </CardContent>
        </Card>
      </div>
    </ResellerShell>
  );
}
