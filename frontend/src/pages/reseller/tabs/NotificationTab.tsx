import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "reseller_notification_settings";

export default function NotificationTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    lowBalanceAlerts: true,
    subscriptionExpiryAlerts: true,
    customerPausedAlerts: true,
    dailyAuditDigest: false,
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setSettings(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast({
      title: "Notification settings saved",
      description: "Your reseller alert preferences have been updated.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-500">
            Control the alerts you want to track while scaling customer accounts.
          </p>
        </div>
        <Button className="rounded-xl bg-[#16A249] text-white hover:bg-[#12813a]" onClick={save}>
          Save Preferences
        </Button>
      </div>

      <div className="space-y-3">
        {[
          ["lowBalanceAlerts", "Low balance alerts"],
          ["subscriptionExpiryAlerts", "Subscription expiry alerts"],
          ["customerPausedAlerts", "Customer paused alerts"],
          ["dailyAuditDigest", "Daily audit digest"],
        ].map(([key, label]) => (
          <div key={key} className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">Applies to reseller panel activity.</p>
            </div>
            <Switch
              checked={settings[key as keyof typeof settings]}
              onCheckedChange={(checked) =>
                setSettings((current) => ({ ...current, [key]: checked }))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
