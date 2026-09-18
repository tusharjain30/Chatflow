import { useEffect, useState } from "react";
import axios from "axios";
import { getAuthToken } from "@/utils/authStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const FIELD_TYPES = [
  "text",
  "number",
  "email",
  "url",
  "date",
  "time",
  "datetime",
];

interface Props {
  open: boolean;
  onClose: () => void;
  field: {
    id: string;
    name: string;
    type: string;
  } | null;
  onSuccess?: () => void;
}

export default function EditCustomFieldModal({
  open,
  onClose,
  field,
  onSuccess,
}: Props) {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [loading, setLoading] = useState(false);

  const token = getAuthToken();

  /* ---------------- PREFILL ---------------- */
  useEffect(() => {
    if (field) {
      setName(field.name);
      setType(field.type);
    }
  }, [field]);

  /* ---------------- UPDATE ---------------- */
  const handleUpdate = async () => {
    if (!name.trim()) {
      return toast({
        title: "Validation Error",
        description: "Field name is required",
        variant: "destructive",
      });
    }

    try {
      setLoading(true);

      const res = await axios.put(
        `${API_BASE}/user/contacts/custom-fields/update`,
        {
          fieldId: field?.id,
          name,
          type,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status === 1) {
        toast({
          title: "Success",
          description: res.data.message,
        });

        onClose();
        onSuccess?.();
      }
    } catch (err: any) {
      console.error(err);

      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to update field",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Custom Field</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* Name */}
          <Input
            placeholder="Field name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Type */}
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>

            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-[#1FBA58] text-white"
            >
              {loading ? "Updating..." : "Update Field"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}