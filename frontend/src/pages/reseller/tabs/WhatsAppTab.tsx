import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function WhatsAppTab() {
  const [form, setForm] = useState({
    wabaId: "",
    phoneNumberId: "",
    accessToken: "",
    webhookToken: "",
  });

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          WhatsApp API Configuration
        </h2>
        <p className="text-sm text-gray-500">
          Connect your Meta (WABA) account to enable messaging
        </p>
      </div>

      {/* FORM */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* WABA ID */}
        <div className="space-y-2">
          <Label>WABA ID</Label>
          <Input
            placeholder="WhatsApp Business Account ID"
            className="bg-gray-50 border focus:border-[#16A249]"
            onChange={(e) =>
              setForm((p) => ({ ...p, wabaId: e.target.value }))
            }
          />
        </div>

        {/* PHONE NUMBER ID */}
        <div className="space-y-2">
          <Label>Phone Number ID</Label>
          <Input
            placeholder="Meta Phone Number ID"
            className="bg-gray-50 border focus:border-[#16A249]"
            onChange={(e) =>
              setForm((p) => ({ ...p, phoneNumberId: e.target.value }))
            }
          />
        </div>

        {/* ACCESS TOKEN */}
        <div className="space-y-2 md:col-span-2">
          <Label>Access Token</Label>
          <Input
            type="password"
            placeholder="Paste permanent access token"
            className="bg-gray-50 border focus:border-[#16A249]"
            onChange={(e) =>
              setForm((p) => ({ ...p, accessToken: e.target.value }))
            }
          />
        </div>

        {/* WEBHOOK TOKEN */}
        <div className="space-y-2 md:col-span-2">
          <Label>Webhook Verify Token</Label>
          <Input
            placeholder="Custom verify token"
            className="bg-gray-50 border focus:border-[#16A249]"
            onChange={(e) =>
              setForm((p) => ({ ...p, webhookToken: e.target.value }))
            }
          />
        </div>

      </div>

      {/* WEBHOOK INFO BOX */}
      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-800 mb-1">
          Webhook URL
        </p>
        <p className="font-mono text-xs break-all">
          https://yourdomain.com/api/webhook/meta
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3">

        <Button
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Test Connection
        </Button>

        <Button className="bg-[#16A249] text-white hover:bg-[#12813a]">
          Save Configuration
        </Button>

      </div>

    </div>
  );
}