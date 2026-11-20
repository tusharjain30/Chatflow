import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageSquare, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
};

type GroupChatModalProps = {
  open: boolean;
  groupId: string | null;
  groupTitle?: string;
  onClose: () => void;
};

function getAuthHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function displayName(contact: Contact) {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
}

export default function GroupChatModal({
  open,
  groupId,
  groupTitle,
  onClose,
}: GroupChatModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !groupId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/user/contacts/groups/detail/${groupId}`,
          { headers: getAuthHeaders() },
        );
        const json = await res.json();
        if (!cancelled && res.ok && json.status === 1) {
          setContacts(json.data?.contacts || []);
        }
      } catch (error) {
        console.error("Failed to load group contacts for chat:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, groupId]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((contact) => {
      const name = displayName(contact).toLowerCase();
      const phone = (contact.phone || "").toLowerCase();
      const email = (contact.email || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [contacts, search]);

  const openChat = (contact: Contact) => {
    const phone = (contact.phone || "").replace(/\D/g, "");
    if (!phone) return;
    const name = displayName(contact);
    const params = new URLSearchParams({ phone });
    if (name) params.set("name", name);
    onClose();
    navigate(`/inbox?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chat from group</DialogTitle>
          <DialogDescription>
            Choose a contact from{" "}
            <span className="font-medium text-foreground">
              {groupTitle || "this group"}
            </span>{" "}
            to open WhatsApp chat.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1">
          {loading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading contacts...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {contacts.length === 0
                ? "This group has no contacts yet."
                : "No matching contacts."}
            </div>
          ) : (
            filtered.map((contact) => {
              const name = displayName(contact) || contact.phone;
              const initials =
                `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`.toUpperCase() ||
                "C";
              return (
                <button
                  key={contact.id}
                  type="button"
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted/70 transition-colors"
                  onClick={() => openChat(contact)}
                  disabled={!contact.phone}
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.phone || "No phone"}
                    </p>
                  </div>
                  <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                </button>
              );
            })
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
