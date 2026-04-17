import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import { ResellerShell } from "@/components/reseller/ResellerShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type Detail = {
  id: string;
  companyName: string;
  isActive: boolean;
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isActive: boolean;
  }>;
  subscriptions: Array<{
    id: string;
    plan: {
      name: string;
      price: number;
      currency: string;
    };
    startDate: string;
  }>;
  _count: {
    contacts: number;
    templates: number;
    campaigns: number;
  };
};

export default function ResellerCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    ownerFirstName: "",
    ownerLastName: "",
    ownerEmail: "",
    ownerPhone: "",
  });
  const [saving, setSaving] = useState(false);

  const loadDetail = async () => {
    const response = await fetch(
      `${API_BASE}/reseller/customers/detail?accountId=${id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      },
    );
    const json = await response.json();
    if (response.ok && json.status === 1) {
      const nextDetail = json.data;
      setDetail(nextDetail);
      const owner = nextDetail.users?.[0];
      setForm({
        companyName: nextDetail.companyName || "",
        ownerFirstName: owner?.firstName || "",
        ownerLastName: owner?.lastName || "",
        ownerEmail: owner?.email || "",
        ownerPhone: owner?.phone || "",
      });
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/reseller/customers/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          accountId: id,
          ...form,
        }),
      });
      const json = await response.json();

      if (!response.ok || json.status !== 1) {
        throw new Error(json.message || "Unable to save customer");
      }

      toast({
        title: "Customer updated",
        description: "Managed customer details saved successfully.",
      });

      await loadDetail();
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unable to save customer",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResellerShell title={detail?.companyName || "Customer detail"} eyebrow="Managed Account">
      <div className="mb-6">
        <Button
          variant="outline"
          className="border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
          onClick={() => navigate("/reseller/customers")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to customers
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="border-white/10 bg-slate-900/80 text-slate-100">
          <CardHeader>
            <CardTitle>Edit managed customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              {[
                { key: "companyName", label: "Company name" },
                { key: "ownerFirstName", label: "Owner first name" },
                { key: "ownerLastName", label: "Owner last name" },
                { key: "ownerEmail", label: "Owner email" },
                { key: "ownerPhone", label: "Owner phone" },
              ].map((field) => (
                <div
                  key={field.key}
                  className={field.key === "companyName" ? "space-y-2 md:col-span-2" : "space-y-2"}
                >
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
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-slate-900/80 text-slate-100">
            <CardHeader>
              <CardTitle>Account summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Contacts", value: detail?._count.contacts ?? 0 },
                { label: "Templates", value: detail?._count.templates ?? 0 },
                { label: "Campaigns", value: detail?._count.campaigns ?? 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-900/80 text-slate-100">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail?.subscriptions?.length ? (
                detail.subscriptions.map((subscription) => (
                  <div key={subscription.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="font-semibold">{subscription.plan.name}</p>
                    <p className="text-sm text-slate-400">
                      {subscription.plan.currency} {subscription.plan.price.toLocaleString()} / month
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Started {new Date(subscription.startDate).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">
                  No active subscription assigned.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ResellerShell>
  );
}
