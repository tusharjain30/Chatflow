import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResellerSettingsProfile } from "../ResellerSettings";

export default function ProfileTab({
  profile,
  onSave,
  saving,
  loading,
}: {
  profile: ResellerSettingsProfile | null;
  onSave: (payload: Partial<ResellerSettingsProfile>) => Promise<void>;
  saving: boolean;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName || "",
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Business Profile</h2>
          <p className="text-sm text-gray-500">
            Update reseller business identity and owner contact details.
          </p>
        </div>
        <Button
          className="rounded-xl bg-[#16A249] px-5 text-white hover:bg-[#12813a]"
          onClick={() => onSave(form)}
          disabled={saving || loading}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#16A249] text-lg font-semibold text-white">
            {(profile?.firstName?.[0] || "R") + (profile?.lastName?.[0] || "S")}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {profile?.companyName || "Reseller profile"}
            </p>
            <p className="text-xs text-gray-500">{profile?.email || "No email found"}</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {[
            { key: "companyName", label: "Company Name" },
            { key: "firstName", label: "First Name" },
            { key: "lastName", label: "Last Name" },
            { key: "phone", label: "Phone Number" },
          ].map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="text-sm text-gray-700">{field.label}</Label>
              <Input
                value={form[field.key as keyof typeof form]}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                className="border bg-gray-50 focus:border-[#16A249]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
