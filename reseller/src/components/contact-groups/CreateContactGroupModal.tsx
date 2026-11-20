import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthToken } from "@/utils/authStorage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateContactGroupModal = ({ open, onClose, onSuccess }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const getAuthHeaders = () => {
    const token = getAuthToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Please enter group title",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/user/contacts/groups/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          description,
        }),
      });

      const json = await res.json();

      if (res.ok && json.status === 1) {
        toast({
          title: "Success",
          description: json.message,
        });

        setTitle("");
        setDescription("");

        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: json.message || "Failed to create group",
        });
      }
    } catch (err) {
      console.error(err);

      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Contact Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1">Group Title</label>

            <Input
              placeholder="Enter group name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1">Description</label>

            <Textarea
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button
              className="gradient-whatsapp text-primary-foreground"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContactGroupModal;
