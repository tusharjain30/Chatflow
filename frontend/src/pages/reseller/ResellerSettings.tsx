import { useEffect, useState } from "react";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function ResellerSettings() {
  const { user, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    phone: "",
    commissionRate: "",
  });

  useEffect(() => {
    setForm({
      companyName: user?.companyName || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      commissionRate: user?.commissionRate?.toString() || "0",
    });
  }, [user]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();

    const response = await fetch(`${API_BASE}/reseller/profile/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
      body: JSON.stringify({
        companyName: form.companyName,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        commissionRate: Number(form.commissionRate),
      }),
    });

    const json = await response.json();
    if (response.ok && json.status === 1) {
      await refetchProfile();
      toast({
        title: "Settings updated",
        description: "Your reseller profile has been saved.",
      });
      return;
    }

    toast({
      title: "Update failed",
      description: json.message || "Unable to update reseller settings",
      variant: "destructive",
    });
  };

  return (
    <ResellerShell title="Reseller settings" eyebrow="Profile & Commercials">
      <Card className="max-w-3xl border-white/10 bg-slate-900/80 text-slate-100">
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            {[
              { key: "companyName", label: "Company name" },
              { key: "firstName", label: "First name" },
              { key: "lastName", label: "Last name" },
              { key: "phone", label: "Phone" },
              { key: "commissionRate", label: "Commission rate (%)" },
            ].map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  value={form[field.key as keyof typeof form]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  className="border-white/10 bg-slate-950"
                />
              </div>
            ))}

            <div className="md:col-span-2">
              <Button type="submit" className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">
                Save reseller settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </ResellerShell>
  );
}
