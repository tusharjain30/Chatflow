import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Link2,
  Smartphone,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConnectWhatsApp } from "@/components/settings/ConnectWhatsApp";
import { useAuth } from "@/contexts/AuthContext";

const SETTINGS_TABS = [
  "profile",
  "notifications",
  "security",
  "billing",
  "integrations",
  "whatsapp",
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number];

export default function Settings() {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo<SettingsTab>(() => {
    const tab = searchParams.get("tab");
    if (tab && SETTINGS_TABS.includes(tab as SettingsTab)) {
      return tab as SettingsTab;
    }
    return "profile";
  }, [searchParams]);

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-6">No user data found</div>;
  }

  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account and preferences
              </p>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                const next = new URLSearchParams(searchParams);
                next.set("tab", value);
                setSearchParams(next, { replace: true });
              }}
              className="space-y-6"
            >
              <TabsList className="grid grid-cols-4 lg:grid-cols-6 gap-2">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Billing</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="gap-2">
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Integrations</span>
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </TabsTrigger>
              </TabsList>

              {/* ================= PROFILE TAB ================= */}
              <TabsContent value="profile">
                <div className="card-elevated p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Profile Information
                    </h3>

                    <div className="flex items-center gap-6 mb-6">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input value={user.firstName || ""} readOnly />
                      </div>

                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input value={user.lastName || ""} readOnly />
                      </div>

                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={user.email || ""} readOnly />
                      </div>

                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input type="tel" value={user.phone || ""} readOnly />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Company Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input
                          value={user.account?.companyName || ""}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ================= NOTIFICATIONS TAB ================= */}
              <TabsContent value="notifications">
                <div className="card-elevated p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: "New Messages",
                        description:
                          "Get notified when you receive new messages",
                      },
                      {
                        title: "Broadcast Updates",
                        description:
                          "Updates on your broadcast campaign status",
                      },
                      {
                        title: "Contact Activity",
                        description: "When contacts engage with your messages",
                      },
                      {
                        title: "Weekly Reports",
                        description: "Receive weekly performance reports",
                      },
                      {
                        title: "Product Updates",
                        description:
                          "Stay updated on new features and improvements",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
                        <div>
                          <h4 className="font-medium text-foreground">
                            {item.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <Switch defaultChecked={idx < 3} />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ================= SECURITY TAB ================= */}
              <TabsContent value="security">
                <div className="card-elevated p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    Security Settings
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input
                        type="password"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" placeholder="Enter new password" />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">
                        Two-Factor Authentication
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security
                      </p>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </div>
              </TabsContent>

              {/* ================= BILLING TAB ================= */}
              <TabsContent value="billing">
                <div className="space-y-6">
                  <div className="card-elevated p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Current Plan
                        </h3>
                        <p className="text-muted-foreground">
                          You are on the Pro plan
                        </p>
                      </div>
                      <Button variant="outline">Upgrade Plan</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ================= INTEGRATIONS TAB ================= */}
              <TabsContent value="integrations">
                <div className="card-elevated p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-6">
                    Connected Apps
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        name: "Shopify",
                        description: "Sync your e-commerce store",
                        connected: true,
                      },
                      {
                        name: "HubSpot",
                        description: "CRM integration",
                        connected: true,
                      },
                      {
                        name: "Zapier",
                        description: "Automate workflows",
                        connected: false,
                      },
                      {
                        name: "Slack",
                        description: "Team notifications",
                        connected: false,
                      },
                    ].map((app, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-xl border border-border"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Globe className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">
                              {app.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {app.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant={app.connected ? "outline" : "default"}
                          size="sm"
                        >
                          {app.connected ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ================= WHATSAPP TAB ================= */}
              <TabsContent value="whatsapp">
                <ConnectWhatsApp defaultPhone={user.phone || ""} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
