import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TeamTab({
  customers,
  members,
  loading,
  saving,
  onCreate,
  onUpdate,
  onDelete,
}: {
  customers: Array<{
    id: string;
    companyName: string;
    owner: { firstName: string; lastName: string; email: string } | null;
    counts: { users: number };
  }>;
  members: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    roleType: "RESELLER_SUB_ADMIN" | "RESELLER_SUPPORT";
    isActive: boolean;
  }>;
  loading: boolean;
  saving: boolean;
  onCreate: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    roleType: "RESELLER_SUB_ADMIN" | "RESELLER_SUPPORT";
  }) => Promise<void>;
  onUpdate: (
    memberId: string,
    payload: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      roleType: "RESELLER_SUB_ADMIN" | "RESELLER_SUPPORT";
      isActive: boolean;
    }>,
  ) => Promise<void>;
  onDelete: (memberId: string) => Promise<void>;
}) {
  const totalSeats = customers.reduce(
    (sum, customer) => sum + Number(customer.counts?.users || 0),
    0,
  );
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    roleType: "RESELLER_SUPPORT" as "RESELLER_SUB_ADMIN" | "RESELLER_SUPPORT",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Internal Team / Sub-admin</h2>
          <p className="text-sm text-gray-500">
            Manage reseller-side sub-admin and support staff with direct panel access.
          </p>
        </div>
        <Button asChild className="rounded-xl bg-[#16A249] text-white hover:bg-[#12813a]">
          <Link to="/reseller/customers">Open Customer Teams</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Managed accounts", value: customers.length },
          { label: "Customer users", value: totalSeats },
          {
            label: "Internal members",
            value: members.length,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border bg-gray-50 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {loading ? "..." : item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-900">Add internal team member</p>
          <p className="text-xs text-gray-500">
            Create reseller-side sub-admin and support accounts.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            { key: "firstName", label: "First name" },
            { key: "lastName", label: "Last name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "password", label: "Password", type: "password" },
          ].map((field) => (
            <div
              key={field.key}
              className={field.key === "password" ? "space-y-2 md:col-span-2" : "space-y-2"}
            >
              <Label>{field.label}</Label>
              <Input
                type={field.type || "text"}
                value={form[field.key as keyof typeof form]}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                className="border bg-gray-50"
              />
            </div>
          ))}

          <div className="space-y-2 md:col-span-2">
            <Label>Role</Label>
            <Select
              value={form.roleType}
              onValueChange={(value: "RESELLER_SUB_ADMIN" | "RESELLER_SUPPORT") =>
                setForm((current) => ({ ...current, roleType: value }))
              }
            >
              <SelectTrigger className="bg-gray-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESELLER_SUB_ADMIN">Reseller Sub-admin</SelectItem>
                <SelectItem value="RESELLER_SUPPORT">Reseller Support</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <Button
            className="rounded-xl bg-[#16A249] text-white hover:bg-[#12813a]"
            disabled={saving}
            onClick={async () => {
              await onCreate(form);
              setForm({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                password: "",
                roleType: "RESELLER_SUPPORT",
              });
            }}
          >
            {saving ? "Saving..." : "Add internal member"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {members.length ? (
          members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {member.firstName} {member.lastName}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {member.email} | {member.phone}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[180px_140px_auto]">
                <Select
                  value={member.roleType}
                  onValueChange={(value: "RESELLER_SUB_ADMIN" | "RESELLER_SUPPORT") =>
                    onUpdate(member.id, { roleType: value })
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESELLER_SUB_ADMIN">Reseller Sub-admin</SelectItem>
                    <SelectItem value="RESELLER_SUPPORT">Reseller Support</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl bg-white"
                  onClick={() => onUpdate(member.id, { isActive: !member.isActive })}
                >
                  {member.isActive ? "Pause Member" : "Activate Member"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onDelete(member.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No internal reseller team members added yet.
          </div>
        )}
      </div>

      <div className="space-y-3">
        {customers.length ? (
          customers.slice(0, 10).map((customer) => (
            <div
              key={customer.id}
              className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">{customer.companyName}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {customer.owner?.email || "No owner email"} | {customer.counts.users} users
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to={`/reseller/customers/${customer.id}`}>Manage Team</Link>
              </Button>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No customer team data available yet.
          </div>
        )}
      </div>
    </div>
  );
}
