import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SecurityTab({
  onSave,
  saving,
}: {
  onSave: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          <p className="text-sm text-gray-500">
            Change reseller portal password and refresh access safely.
          </p>
        </div>
        <Button
          className="rounded-xl bg-[#16A249] text-white hover:bg-[#12813a]"
          disabled={saving}
          onClick={async () => {
            await onSave(form);
            setForm({
              currentPassword: "",
              newPassword: "",
              confirmNewPassword: "",
            });
          }}
        >
          {saving ? "Updating..." : "Update Password"}
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {[
          ["currentPassword", "Current password"],
          ["newPassword", "New password"],
          ["confirmNewPassword", "Confirm new password"],
        ].map(([key, label]) => (
          <div
            key={key}
            className={key === "confirmNewPassword" ? "space-y-2 md:col-span-2" : "space-y-2"}
          >
            <Label>{label}</Label>
            <Input
              type="password"
              value={form[key as keyof typeof form]}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              className="border bg-gray-50 focus:border-[#16A249]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
