import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Select from "react-select";
import { getAuthToken } from "@/utils/authStorage";

type Props = {
  contactId: string;
  onSuccess: () => void;
};

type AvailableField = {
  id: string;
  name: string;
  key: string;
  type: string;
};

type Group = {
  id: string;
  title: string;
  description: string | null;
  contactsCount: number;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function UpdateContactForm({ contactId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    country: "",
    phone: "",
    languageCode: "",
    email: "",
    isOptedOut: false,
    groups: [] as string[],
  });

  const [groups, setGroups] = useState<Group[]>([]);
  const [availableCustomFields, setAvailableCustomFields] = useState<
    AvailableField[]
  >([]);

  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  /* ================= INPUT CHANGE ================= */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggle = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      isOptedOut: checked,
    }));
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    setCustomFields((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* ================= FETCH DATA ================= */

  const fetchContact = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/user/contacts/contact/detail/${contactId}`,
        {
          headers: getAuthHeaders(),
        },
      );

      const json = await res.json();

      if (res.ok && json.status === 1) {
        const contact = json.data;

        setForm({
          firstName: contact.firstName || "",
          lastName: contact.lastName || "",
          country: contact.country || "",
          phone: contact.phone || "",
          languageCode: contact.languageCode || "",
          email: contact.email || "",
          isOptedOut: contact.isOptedOut || false,
          groups: contact.groups?.map((g: any) => g.id) || [],
        });

        setCustomFields(contact.customFields || {});
      }
    } catch (err) {
      console.error("Failed to fetch contact:", err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/user/contacts/groups/read?search=&limit=50&page=1`,
        {
          headers: getAuthHeaders(),
        },
      );

      const json = await res.json();

      if (res.ok && json.status === 1) {
        setGroups(json.data?.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/contacts/custom-fields/list`, {
        headers: getAuthHeaders(),
      });

      const json = await res.json();

      if (res.ok && json.status === 1) {
        setAvailableCustomFields(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch custom fields:", err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchCustomFields();
    fetchContact();
  }, [contactId]);

  useEffect(() => {
    if (contactId) {
      fetchGroups();
      fetchCustomFields();
      fetchContact();
    }
  }, [contactId]);

  /* ================= UPDATE SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const payload = {
        contactId,
        firstName: form.firstName,
        lastName: form.lastName,
        country: form.country,
        languageCode: form.languageCode,
        email: form.email,
        isOptedOut: form.isOptedOut,
        groups: form.groups,
        customFields: customFields,
      };

      const res = await fetch(`${API_BASE}/user/contacts/contact/update`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.status === 1) {
        toast.success("Contact updated successfully");

        onSuccess(); // modal close + refresh contacts
      } else {
        toast.error(json.message || "Failed to update contact");
      }
    } catch (error) {
      console.error("Update contact error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  const groupOptions = groups.map((group) => ({
    value: group.id,
    label: `${group.title} (${group.contactsCount})`,
  }));

  /* ================= UI ================= */

  return (
    <div className="max-h-[75vh] overflow-y-auto px-4 pr-3 pt-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Label className="text-sm font-semibold">Basic Information</Label>

        {/* First + Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">First Name</Label>
            <Input
              name="firstName"
              placeholder="First name"
              value={form.firstName}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Last Name</Label>
            <Input
              name="lastName"
              placeholder="Last name"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Email + Country */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Country</Label>
            <Input
              name="country"
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Language */}
        <div className="space-y-1">
          <Label className="text-xs">Language Code</Label>
          <Input
            name="languageCode"
            placeholder="Language"
            value={form.languageCode}
            onChange={handleChange}
          />
        </div>

        {/* Opt Out Toggle (NOT inside grid) */}
        <div className="flex items-center justify-between border rounded-md p-3">
          <Label className="text-sm">Opt-out Contact</Label>
          <Switch checked={form.isOptedOut} onCheckedChange={handleToggle} />
        </div>

        {/* Groups */}
        <div className="space-y-1">
          <Label className="text-sm">Groups</Label>

          <Select
            options={groupOptions}
            isMulti
            value={groupOptions.filter((o) => form.groups.includes(o.value))}
            onChange={(selected) => {
              const ids = selected ? selected.map((s) => s.value) : [];

              setForm((prev) => ({
                ...prev,
                groups: ids,
              }));
            }}
          />
        </div>

        {/* Custom Fields */}
        {availableCustomFields.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-semibold">Custom Fields</Label>

            <div className="grid grid-cols-2 gap-3">
              {availableCustomFields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <Label className="text-xs">{field.name}</Label>

                  <Input
                    type={field.type || "text"}
                    placeholder={field.name}
                    value={customFields[field.key] || ""}
                    onChange={(e) =>
                      handleCustomFieldChange(field.key, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <Button className="w-full" disabled={loading}>
          {loading ? "Updating Contact..." : "Update Contact"}
        </Button>
      </form>
    </div>
  );
}
