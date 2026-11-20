import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAuthToken } from "@/utils/authStorage";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const getAuthHeaders = () => {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

interface Props {
  open: boolean;
  groupId: string | null;
  initialTitle: string;
  initialDescription: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditContactGroupModal({
  open,
  groupId,
  initialTitle,
  initialDescription,
  onClose,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle || "");
      setDescription(initialDescription || "");
    }
  }, [open, initialTitle, initialDescription]);

  const updateGroup = async () => {
    if (!groupId || !title.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/user/contacts/groups/update`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          groupId,
          title: title.trim(),
          description,
        }),
      });

      const json = await res.json();

      if (res.ok && json.status === 1) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Update group failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contact Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Group Name</label>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Description</label>

            <Textarea
              value={description || ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button onClick={updateGroup} disabled={loading}>
              {loading ? "Updating..." : "Update Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
