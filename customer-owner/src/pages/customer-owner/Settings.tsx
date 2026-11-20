import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Bot,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  Puzzle,
  Smartphone,
  Ticket,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/dashboard/Header";
import { ConnectWhatsApp } from "@/components/settings/ConnectWhatsApp";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

const SETTINGS_NAV = [
  { id: "profile", label: "General Settings", icon: User },
  { id: "whatsapp", label: "Whatsapp settings", icon: Smartphone },
  { id: "contact-fields", label: "Contact fields", icon: FileText },
  { id: "tickets", label: "Ticket settings", icon: Ticket },
  { id: "automation", label: "Automation settings", icon: Bot },
  { id: "team", label: "Team", icon: Users },
  { id: "password", label: "Change Password", icon: Lock },
  { id: "security", label: "Roles & Permissions", icon: KeyRound },
  { id: "integrations", label: "Plugins", icon: Puzzle },
] as const;

type SettingsTab = (typeof SETTINGS_NAV)[number]["id"];

const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Singapore",
  "Australia",
  "Canada",
  "Other",
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading, refetchProfile, logout } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [notificationSoundEnabled, setNotificationSoundEnabled] =
    useState(false);
  const [campaignResendEnabled, setCampaignResendEnabled] = useState(false);

  const activeTab = useMemo<SettingsTab>(() => {
    const tab = searchParams.get("tab");
    if (tab && SETTINGS_NAV.some((item) => item.id === tab)) {
      return tab as SettingsTab;
    }
    return "profile";
  }, [searchParams]);

  const autoOpenWhatsApp = searchParams.get("setup") === "1";

  useEffect(() => {
    if (!user?.account) return;
    setCompanyName(user.account.companyName || "");
    setAddress(user.account.address || "");
    setCity(user.account.city || "");
    setState(user.account.state || "");
    setZipCode(user.account.zipCode || "");
    setCountry(user.account.country || "");
    setTimezone(user.account.timezone || "UTC");
    setNotificationSoundEnabled(Boolean(user.account.notificationSoundEnabled));
    setCampaignResendEnabled(Boolean(user.account.campaignResendEnabled));
  }, [user]);

  const setTab = (tab: SettingsTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    if (tab !== "whatsapp") next.delete("setup");
    setSearchParams(next, { replace: true });
  };

  const handleSaveGeneral = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Validation",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    setSavingSettings(true);
    try {
      await apiFetch("/user/account/update", {
        method: "PUT",
        body: JSON.stringify({
          companyName: companyName.trim(),
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zipCode: zipCode.trim() || null,
          country: country || null,
          timezone,
          notificationSoundEnabled,
          campaignResendEnabled,
        }),
      });
      await refetchProfile();
      toast({
        title: "Settings saved",
        description: "Organization settings updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description:
          error instanceof Error ? error.message : "Unable to save settings",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async () => {
    const nextErrors: Record<string, string> = {};
    if (!currentPassword) {
      nextErrors.currentPassword = "Current password is required";
    }
    if (newPassword.length < 8) {
      nextErrors.newPassword = "New password must be at least 8 characters";
    }
    if (newPassword && currentPassword && newPassword === currentPassword) {
      nextErrors.newPassword =
        "New password must be different from your current password";
    }
    if (confirmNewPassword !== newPassword) {
      nextErrors.confirmNewPassword = "Passwords do not match";
    }
    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSavingPassword(true);
    try {
      await apiFetch("/user/auth/changePassword", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      toast({
        title: "Password updated",
        description: "Please sign in again with your new password.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordErrors({});
      logout();
      navigate("/login");
    } catch (error) {
      toast({
        title: "Password update failed",
        description:
          error instanceof Error ? error.message : "Unable to update password",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-6">No user data found</div>;
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header
        title={
          activeTab === "password"
            ? "Change Password"
            : activeTab === "whatsapp"
              ? "WhatsApp Settings"
              : "General Settings"
        }
        subtitle={
          activeTab === "password"
            ? "Update your account password."
            : "Update your organization settings."
        }
      />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="lg:w-56 shrink-0">
              <nav className="rounded-xl border border-slate-200 bg-white p-2 space-y-0.5">
                {SETTINGS_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={
                        active
                          ? "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left bg-slate-100 text-slate-900 font-semibold"
                          : "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left text-slate-600 hover:bg-slate-50"
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="flex-1 min-w-0 space-y-4">
              {activeTab === "profile" && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      General Settings
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                      Update your organization settings.
                    </p>
                  </div>

                  <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        Organization Details
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Specify the name of your business/organization
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Organization Name</Label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your organization"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Physical address</Label>
                        <Input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Street address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Zip Code</Label>
                        <Input
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Select
                          value={country || undefined}
                          onValueChange={setCountry}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        Timezone
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        All your data will be processed according to this
                        timezone
                      </p>
                    </div>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="max-w-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        Notifications
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Configure notification settings for new message alerts
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 px-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Enable notification sound
                        </p>
                      </div>
                      <Switch
                        checked={notificationSoundEnabled}
                        onCheckedChange={setNotificationSoundEnabled}
                      />
                    </div>
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        Failed Message Retry Settings (Campaigns)
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Configure the intervals at which failed campaign
                        messages will be retried.
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 px-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Enable campaign resend feature
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          If active, failed messages in campaigns will be
                          retried according to your set intervals.
                        </p>
                      </div>
                      <Switch
                        checked={campaignResendEnabled}
                        onCheckedChange={setCampaignResendEnabled}
                      />
                    </div>
                  </section>

                  <div className="flex justify-end">
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-28"
                      onClick={handleSaveGeneral}
                      disabled={savingSettings}
                    >
                      {savingSettings ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "whatsapp" && (
                <ConnectWhatsApp
                  defaultPhone={user.phone || ""}
                  autoOpen={autoOpenWhatsApp}
                />
              )}

              {activeTab === "contact-fields" && (
                <PlaceholderCard
                  title="Contact fields"
                  description="Manage custom contact fields for your audience."
                  actionLabel="Open Contact Fields"
                  to="/contact-custom-fields"
                />
              )}

              {activeTab === "tickets" && (
                <PlaceholderCard
                  title="Ticket settings"
                  description="Manage support tickets and workflows."
                  actionLabel="Open Support"
                  to="/help"
                />
              )}

              {activeTab === "automation" && (
                <PlaceholderCard
                  title="Automation settings"
                  description="Configure chatbot triggers and automated replies."
                  actionLabel="Open Automation"
                  to="/chatbots"
                />
              )}

              {activeTab === "team" && (
                <PlaceholderCard
                  title="Team"
                  description="Invite teammates and manage member access."
                  actionLabel="Open Team"
                  to="/team"
                />
              )}

              {activeTab === "password" && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      Change Password
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                      Choose a strong password you don&apos;t use elsewhere.
                      You&apos;ll be signed out after updating.
                    </p>
                  </div>

                  <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 max-w-lg">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            setPasswordErrors((prev) => {
                              const next = { ...prev };
                              delete next.currentPassword;
                              return next;
                            });
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() =>
                            setShowCurrentPassword((value) => !value)
                          }
                        >
                          {showCurrentPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-xs text-red-500">
                          {passwordErrors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setPasswordErrors((prev) => {
                              const next = { ...prev };
                              delete next.newPassword;
                              return next;
                            });
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword((value) => !value)}
                        >
                          {showNewPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-xs text-red-500">
                          {passwordErrors.newPassword}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password">
                        Confirm new password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-new-password"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={confirmNewPassword}
                          onChange={(e) => {
                            setConfirmNewPassword(e.target.value);
                            setPasswordErrors((prev) => {
                              const next = { ...prev };
                              delete next.confirmNewPassword;
                              return next;
                            });
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() =>
                            setShowConfirmPassword((value) => !value)
                          }
                        >
                          {showConfirmPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                      {passwordErrors.confirmNewPassword && (
                        <p className="text-xs text-red-500">
                          {passwordErrors.confirmNewPassword}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-36"
                        onClick={handleChangePassword}
                        disabled={savingPassword}
                      >
                        {savingPassword ? "Updating..." : "Update password"}
                      </Button>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "security" && (
                <PlaceholderCard
                  title="Roles & Permissions"
                  description="Team role presets and member access are managed from the Team page."
                  actionLabel="Open Team"
                  to="/team"
                />
              )}

              {activeTab === "integrations" && (
                <PlaceholderCard
                  title="Plugins"
                  description="Third-party plugins are coming soon. WhatsApp is the primary integration today."
                  actionLabel="WhatsApp settings"
                  to="/settings?tab=whatsapp"
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PlaceholderCard({
  title,
  description,
  actionLabel,
  to,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  to?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      {actionLabel && to ? (
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          asChild
        >
          <Link to={to}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
