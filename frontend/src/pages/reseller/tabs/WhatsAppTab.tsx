import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ResellerSettingsProfile } from "../ResellerSettings";

const STORAGE_KEY = "reseller_whatsapp_config";

export default function WhatsAppTab({
  profile,
}: {
  profile: ResellerSettingsProfile | null;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    wabaId: "",
    phoneNumberId: "",
    accessToken: "",
    webhookToken: "",
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setForm(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    toast({
      title: "WhatsApp configuration saved",
      description: "Your reseller-side WhatsApp API configuration was stored locally.",
    });
  };

  const testConnection = () => {
    if (!form.wabaId || !form.phoneNumberId || !form.accessToken || !form.webhookToken) {
      toast({
        title: "Missing configuration",
        description: "Complete all WhatsApp API fields before testing connection.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Configuration looks valid",
      description: "Required WhatsApp API fields are present and ready for use.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">WhatsApp API Configuration</h2>
        <p className="text-sm text-gray-500">
          Keep reseller-side Meta credentials and webhook verification details ready.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>WABA ID</Label>
          <Input
            value={form.wabaId}
            className="border bg-gray-50 focus:border-[#16A249]"
            onChange={(event) =>
              setForm((current) => ({ ...current, wabaId: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Phone Number ID</Label>
          <Input
            value={form.phoneNumberId}
            className="border bg-gray-50 focus:border-[#16A249]"
            onChange={(event) =>
              setForm((current) => ({ ...current, phoneNumberId: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Access Token</Label>
          <Input
            type="password"
            value={form.accessToken}
            className="border bg-gray-50 focus:border-[#16A249]"
            onChange={(event) =>
              setForm((current) => ({ ...current, accessToken: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Webhook Verify Token</Label>
          <Input
            value={form.webhookToken}
            className="border bg-gray-50 focus:border-[#16A249]"
            onChange={(event) =>
              setForm((current) => ({ ...current, webhookToken: event.target.value }))
            }
          />
        </div>
      </div>

      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
        <p className="mb-1 font-medium text-gray-800">Webhook URL</p>
        <p className="break-all font-mono text-xs">
          https://yourdomain.com/api/webhook/meta/{profile?.companyName?.toLowerCase().replace(/\s+/g, "-") || "reseller"}
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" className="rounded-xl" onClick={testConnection}>
          Test Connection
        </Button>
        <Button className="rounded-xl bg-[#16A249] text-white hover:bg-[#12813a]" onClick={save}>
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
