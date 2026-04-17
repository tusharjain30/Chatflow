import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

const initialForm = {
  companyName: "",
  ownerFirstName: "",
  ownerLastName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerPassword: "",
};

export default function ResellerCustomerCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const createCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/reseller/customers/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(form),
      });

      const json = await response.json();
      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to create customer");
      }

      toast({
        title: "Customer created",
        description: "The client workspace and owner account were added.",
      });

      setForm(initialForm);
      navigate("/reseller/customers");
    } catch (error) {
      toast({
        title: "Create failed",
        description:
          error instanceof Error ? error.message : "Unable to create customer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResellerShell title="Create customer workspace" eyebrow="New Onboarding">
      <Card className="max-w-3xl border-white/10 bg-slate-900/80 text-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-cyan-300" />
            Add a new managed customer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createCustomer} className="grid gap-4 md:grid-cols-2">
            {[
              { key: "companyName", label: "Company name", type: "text" },
              {
                key: "ownerFirstName",
                label: "Owner first name",
                type: "text",
              },
              { key: "ownerLastName", label: "Owner last name", type: "text" },
              { key: "ownerEmail", label: "Owner email", type: "email" },
              { key: "ownerPhone", label: "Owner phone", type: "text" },
              {
                key: "ownerPassword",
                label: "Temporary password",
                type: "password",
              },
            ].map((field) => (
              <div
                key={field.key}
                className={
                  field.key === "companyName"
                    ? "space-y-2 md:col-span-2"
                    : "space-y-2"
                }
              >
                <Label>{field.label}</Label>
                <Input
                  type={field.type}
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

            <div className="md:col-span-2 flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              >
                {loading ? "Creating..." : "Create customer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
                onClick={() => navigate("/reseller/customers")}
              >
                View managed customers
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </ResellerShell>
  );
}
