import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import { getAuthToken } from "@/utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  isOptedOut: boolean;
  groups: { id: string; title: string }[];
};

interface Props {
  open: boolean;
  onClose: () => void;
  groupIds: string[];
  onSuccess?: () => void;
}

export default function AssignGroupsModal({
  open,
  onClose,
  groupIds,
  onSuccess,
}: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [search, setSearch] = useState("");

  const token = getAuthToken();

  /* ---------------- FETCH CONTACTS ---------------- */
  const fetchContacts = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE}/user/contacts/contact/read`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            search,
            page: 1,
            limit: 50,
          },
        }
      );

      if (res.data.status === 1) {
        setContacts(res.data.data.contacts);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchContacts();
  }, [open, search]);

  /* ---------------- ASSIGN API ---------------- */
  const handleAssign = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one contact");
      return;
    }

    try {
      setAssignLoading(true);

      const res = await axios.post(
        `${API_BASE}/user/contacts/contact/assign-groups`,
        {
          contactIds: selected,
          groupIds,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status === 1) {
        toast.success(res.data.message);
        onClose();
        setSelected([]);
        onSuccess?.();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to assign groups");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Groups to Contacts</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-auto border rounded-lg mt-4">
          {loading ? (
            <p className="p-4 text-sm">Loading...</p>
          ) : contacts.length === 0 ? (
            <p className="p-4 text-sm">No contacts found</p>
          ) : (
            contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-2 border-b hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selected.includes(c.id)}
                    disabled={c.isOptedOut}
                    onCheckedChange={() => {
                      setSelected((prev) =>
                        prev.includes(c.id)
                          ? prev.filter((id) => id !== c.id)
                          : [...prev, c.id]
                      );
                    }}
                  />

                  <div>
                    <p className="text-sm font-medium">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.phone}
                    </p>
                  </div>
                </div>

                {c.isOptedOut && (
                  <span className="text-xs text-red-500">Opted Out</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleAssign}
            disabled={assignLoading}
            className="bg-gradient-to-r from-[#134E4A] to-[#0f766e] text-white"
          >
            {assignLoading ? "Assigning..." : "Assign Groups"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}