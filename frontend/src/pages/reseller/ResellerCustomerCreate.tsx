import { useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
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

  const handleBack = () => {
    navigate("/reseller/customers");
  };

  return (
    <ResellerShell title="Create customer workspace" eyebrow="New Onboarding">
      <Card className="w-full bg-white border shadow-sm">
        {/* HEADER */}
        <CardHeader className="border-b bg-gray-50 rounded-t-2xl flex flex-row items-center justify-between">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-3">
            {/* BACK BUTTON */}
            <button
              onClick={handleBack}
              className="h-9 w-9 flex items-center justify-center rounded-lg border bg-white 
                 hover:bg-gray-100 transition"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>

            {/* TITLE */}
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Plus className="h-5 w-5 text-[#16A249]" />
              Add a new managed customer
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={createCustomer} className="grid gap-5 md:grid-cols-2">
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
                <Label className="text-sm text-gray-700">{field.label}</Label>

                <Input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="bg-gray-50 border focus:border-[#16A249] focus:ring-[#16A249]"
                />
              </div>
            ))}

            {/* ACTION BUTTONS */}
            <div className="md:col-span-2 flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#16A249] hover:bg-[#12813a] text-white rounded-xl px-5"
              >
                {loading ? "Creating..." : "Create customer"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl"
                onClick={() => navigate("/reseller/customers")}
              >
                View customers
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </ResellerShell>
  );
}
