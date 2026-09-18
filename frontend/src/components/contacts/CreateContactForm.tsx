import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Select from "react-select";
import { getAuthToken } from "@/utils/authStorage";

type Props = {
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

export default function CreateContactForm({ onSuccess }: Props) {
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

  const [availableCustomFields, setAvailableCustomFields] = useState<
    AvailableField[]
  >([]);

  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [groups, setGroups] = useState<Group[]>([]);

  const getInputType = (type: string) => {
    switch (type) {
      case "email":
        return "email";
      case "number":
        return "number";
      case "date":
        return "date";
      case "time":
        return "time";
      case "datetime":
        return "datetime-local";
      case "url":
        return "url";
      default:
        return "text";
    }
  };

  const formatIndianPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);

    if (digits.length <= 5) return digits;

    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatIndianPhone(e.target.value);

    setForm((prev) => ({
      ...prev,
      phone: formatted,
    }));
  };

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

  // const toggleGroup = (groupId: string) => {
  //   setForm((prev) => {
  //     const exists = prev.groups.includes(groupId);

  //     return {
  //       ...prev,
  //       groups: exists
  //         ? prev.groups.filter((g) => g !== groupId)
  //         : [...prev.groups, groupId],
  //     };
  //   });
  // };

  /* ================= CUSTOM FIELD CHANGE ================= */

  const handleCustomFieldChange = (key: string, value: string) => {
    setCustomFields((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* ================= API CALL ================= */

  const fetchCustomFields = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/contacts/custom-fields/list`, {
        headers: getAuthHeaders(),
      });

      const json = await res.json();

      if (res.ok && json.status === 1) {
        setAvailableCustomFields(json.data?.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch custom fields:", err);
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

  useEffect(() => {
    fetchCustomFields();
    fetchGroups();
  }, []);

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    const cleanPhone = form.phone.replace(/\D/g, "");

    if (!form.firstName.trim()) {
      toast.error("First name is required");
      setLoading(false);
      return;
    }

    if (cleanPhone.length !== 10) {
      toast.error("Enter valid 10 digit phone number");
      setLoading(false);
      return;
    }
    
    try {
      const filteredCustomFields = Object.fromEntries(
        Object.entries(customFields).filter(
          ([_, value]) => value !== "" && value !== null && value !== undefined,
        ),
      );

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        country: form.country,
        phone: cleanPhone,
        languageCode: form.languageCode,
        email: form.email,
        isOptedOut: form.isOptedOut,
        groups: form.groups, // selected group IDs
        customFields: filteredCustomFields,
      };

      const res = await fetch(`${API_BASE}/user/contacts/contact/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.status === 1) {
        console.log("Contact Created:", json);

        toast.success("Contact created successfully");

        onSuccess(); // close modal / refresh list
      } else {
        toast.error(json.message || "Failed to create contact");
      }
    } catch (error) {
      console.error("Create contact error:", error);
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
    <div className="max-h-[75vh] overflow-y-auto px-4 pr-3 pt-2 scrollbar-thin">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BASIC INFO */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Basic Information</Label>

          {/* First + Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-xs">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Enter first name"
                value={form.firstName}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-xs">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Enter last name"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                placeholder="98765-43210"
                value={form.phone}
                onChange={handlePhoneChange}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Country + Language */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="country" className="text-xs">
                Country
              </Label>
              <Input
                id="country"
                name="country"
                placeholder="India"
                value={form.country}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="languageCode" className="text-xs">
                Language Code
              </Label>
              <Input
                id="languageCode"
                name="languageCode"
                placeholder="en"
                value={form.languageCode}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* OPT OUT */}
        <div className="flex items-center justify-between border rounded-md p-3">
          <Label>Opt-out Contact</Label>
          <Switch checked={form.isOptedOut} onCheckedChange={handleToggle} />
        </div>

        {/* GROUPS */}
        <div className="space-y-2">
          <Label>Groups</Label>

          <Select
            options={groupOptions}
            isMulti
            placeholder="Select groups..."
            value={groupOptions.filter((option) =>
              form.groups.includes(option.value),
            )}
            onChange={(selected: any) => {
              const ids = selected?.map((item: any) => item.value) || [];

              setForm((prev) => ({
                ...prev,
                groups: ids,
              }));
            }}
            className="text-sm"
          />
        </div>

        {/* CUSTOM FIELDS */}
        {availableCustomFields.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-semibold">Custom Fields</Label>

            <div className="grid grid-cols-2 gap-3">
              {availableCustomFields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {field.name}
                  </Label>

                  <Input
                    type={getInputType(field.type)}
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
          {loading ? "Creating Contact..." : "Create Contact"}
        </Button>
      </form>
    </div>
  );
}
