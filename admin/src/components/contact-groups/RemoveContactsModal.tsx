import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAuthToken } from "@/utils/authStorage";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const getAuthHeaders = () => {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  country?: string;
  languageCode?: string;
  isOptedOut?: boolean;
  createdAt?: string;
};

interface Props {
  open: boolean;
  groupId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RemoveContactsModal({
  open,
  groupId,
  onClose,
  onSuccess,
}: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  /* ---------------- FETCH GROUP CONTACTS ---------------- */

  const fetchContacts = async () => {
    if (!groupId) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await fetch(
        `${API_BASE}/user/contacts/groups/contacts/${groupId}?${params.toString()}`,
        {
          headers: getAuthHeaders(),
        },
      );

      const json = await res.json();

      if (res.ok && json.status === 1) {
        setContacts(json.data.items || []);
        setTotalPages(json.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch group contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchContacts();
  }, [open, page, debouncedSearch]);

  /* ---------------- TOGGLE CONTACT ---------------- */

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    const allIds = contacts.map((c) => c.id);

    const allSelected = allIds.every((id) => selected.includes(id));

    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...allIds])]);
    }
  };

  /* ---------------- REMOVE CONTACTS ---------------- */

  const removeContacts = async () => {
    if (!groupId || selected.length === 0) return;

    try {
      setRemoving(true);

      const res = await fetch(
        `${API_BASE}/user/contacts/groups/remove-contacts`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            groupId,
            contactIds: selected,
          }),
        },
      );

      const json = await res.json();

      if (res.ok && json.status === 1) {
        if (json.data.removedCount > 0) {
          await fetchContacts(); // modal contacts refresh
          onSuccess(); // groups table refresh
          setSelected([]);

          if (contacts.length - json.data.removedCount <= 0) {
            onClose();
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(false);
    }
  };

  const allSelected =
    contacts.length > 0 && contacts.every((c) => selected.includes(c.id));

  useEffect(() => {
    const timer = setTimeout(() => {
      const value = search.trim();
      setDebouncedSearch(value);
      setPage(1); // search par pagination reset
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Remove Contacts From Group</DialogTitle>
        </DialogHeader>
        <div className="relative mt-2">
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center justify-between mt-3 mb-2">
          <div className="flex items-center gap-2">
            <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />

            <span className="text-sm text-muted-foreground">Select All</span>
          </div>

          {selected.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selected.length} selected
            </span>
          )}
        </div>

        {loading && (
          <div className="text-center py-6 text-muted-foreground">
            Loading contacts...
          </div>
        )}

        {!loading && contacts.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="w-full max-w-md border-2 border-dashed border-orange-300 bg-orange-50/40 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>

              <span className="text-sm font-semibold text-orange-700">
                No contacts in this group
              </span>

              <p className="text-xs text-muted-foreground max-w-xs">
                This group currently has no contacts. Add contacts to the group
                to manage them here.
              </p>
            </div>
          </div>
        )}

        {!loading && contacts.length > 0 && (
          <div className="max-h-[420px] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {contacts.map((c) => {
                const initials =
                  (c.firstName?.[0] || "") + (c.lastName?.[0] || "");

                const isSelected = selected.includes(c.id);

                return (
                  <div
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    className={`relative cursor-pointer border rounded-xl p-4 flex flex-col items-center text-center transition
      ${
        isSelected
          ? "border-red-500 bg-red-50"
          : "border-border hover:bg-muted/40"
      }`}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-2 right-2">
                      <Checkbox checked={isSelected} />
                    </div>

                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                      {initials || "U"}
                    </div>

                    {/* Name */}
                    <div className="mt-3 text-sm font-semibold">
                      {c.firstName} {c.lastName}
                    </div>

                    {/* Phone */}
                    <div className="text-xs text-muted-foreground mt-1">
                      {c.phone}
                    </div>

                    {/* Email */}
                    {c.email && (
                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]">
                        {c.email}
                      </div>
                    )}

                    {/* Country + Language */}
                    <div className="flex gap-2 mt-2 text-[10px] text-muted-foreground">
                      {c.country && (
                        <span className="px-2 py-0.5 bg-muted rounded">
                          {c.country}
                        </span>
                      )}

                      {c.languageCode && (
                        <span className="px-2 py-0.5 bg-muted rounded uppercase">
                          {c.languageCode}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>

              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>

              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="destructive"
            disabled={selected.length === 0 || removing}
            onClick={removeContacts}
          >
            {removing ? "Removing..." : `Remove ${selected.length} Contact(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
