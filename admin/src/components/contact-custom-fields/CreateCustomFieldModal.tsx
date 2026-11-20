import { useState } from "react";
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
import { useToast } from "@/components/ui/use-toast"; // ✅

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
  onSuccess?: () => void;
}

const capitalizeWords = (str: string) => {
  return str
    .toLowerCase()
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function CreateCustomFieldModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const token = getAuthToken();

  const handleCreate = async () => {
    if (!name.trim()) {
      return toast({
        title: "Validation Error",
        description: "Field name is required",
        variant: "destructive",
      });
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/user/contacts/custom-fields/create`,
        {
          name: capitalizeWords(name),
          type,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.status === 1) {
        toast({
          title: "Success",
          description: res.data.message,
        });

        // reset
        setName("");
        setType("text");

        onClose();
        onSuccess?.();
      }
    } catch (err: any) {
      console.error(err);

      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to create field",
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
          <DialogTitle>Create Custom Field</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* Name */}
          <Input
            placeholder="Field name (e.g. Email Address)"
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
              onClick={handleCreate}
              disabled={loading}
              className="gradient-whatsapp text-primary-foreground gap-2 text-xs"
            >
              {loading ? "Creating..." : "Create Field"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
