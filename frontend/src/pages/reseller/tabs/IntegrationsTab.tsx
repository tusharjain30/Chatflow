import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "reseller_integrations_settings";

export default function IntegrationsTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    metaSync: true,
    webhookRelay: true,
    billingExport: false,
    auditDigestWebhook: false,
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
      title: "Integrations updated",
      description: "Reseller integration preferences have been saved.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-500">
            Manage external sync preferences for billing, audit, and WhatsApp operations.
          </p>
        </div>
        <Button className="rounded-xl bg-[#16A249] text-white hover:bg-[#12813a]" onClick={save}>
          Save Integrations
        </Button>
      </div>

      <div className="space-y-3">
        {[
          ["metaSync", "Meta account sync", "Keep reseller WhatsApp credentials aligned with Meta account details."],
          ["webhookRelay", "Webhook relay", "Forward inbound webhook events into reseller monitoring flows."],
          ["billingExport", "Billing export", "Prepare billing history for export-ready finance workflows."],
          ["auditDigestWebhook", "Audit digest webhook", "Send audit summaries to an external operations endpoint."],
        ].map(([key, label, helper]) => (
          <div key={key} className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm">
            <div className="pr-4">
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="mt-1 text-xs text-gray-500">{helper}</p>
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
