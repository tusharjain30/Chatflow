import { useEffect, useState } from "react";
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
  email: string | null;
};

type GroupDetail = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: Contact[];
  totalContacts: number;
};

interface Props {
  open: boolean;
  groupId: string | null;
  onClose: () => void;
}

const ViewContactGroupModal = ({ open, groupId, onClose }: Props) => {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGroupDetail = async () => {
    if (!groupId) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/user/contacts/groups/detail/${groupId}`,
        {
          headers: getAuthHeaders(),
        },
      );

      const json = await res.json();

      if (res.ok && json.status === 1) {
        setGroup(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch group detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchGroupDetail();
  }, [open, groupId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group Details</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="text-center py-6 text-muted-foreground">
            Loading group...
          </div>
        )}

        {group && (
          <div className="space-y-5 text-sm">
            {/* Group Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs">Group Name</p>
                <p className="font-medium text-xs bg-green-100 px-2 py-1 rounded mt-1">
                  {group.title}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground text-xs">Total Contacts</p>
                <p className="font-medium text-xs bg-green-100 px-2 py-1 rounded mt-1">
                  {group.totalContacts}
                </p>
              </div>

              {/* FULL WIDTH DESCRIPTION */}
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Description</p>

                <div className="font-medium text-xs bg-green-100 px-2 py-2 rounded mt-1 break-words whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {group.description || "No description"}
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-xs">Created</p>
                <p className="font-medium text-xs bg-green-100 px-2 py-1 rounded mt-1">
                  {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Contacts */}
            <div>
              <p className="font-semibold text-xs mb-2">Contacts</p>

              {group.contacts.length === 0 ? (
                <div className="flex justify-center py-6">
                  <div className="w-full max-w-sm border-2 border-dashed border-orange-300 bg-orange-50/40 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>

                    <span className="text-sm font-semibold text-orange-700">
                      No contacts in this group
                    </span>

                    <p className="text-xs text-muted-foreground">
                      This group currently has no contacts.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {group.contacts.map((contact) => {
                      const initials =
                        (contact.firstName?.[0] || "") +
                        (contact.lastName?.[0] || "");

                      return (
                        <div
                          key={contact.id}
                          className="border rounded-xl p-4 flex flex-col items-center text-center hover:bg-muted/40 transition"
                        >
                          {/* Avatar */}
                          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                            {initials || "U"}
                          </div>

                          {/* Name */}
                          <div className="mt-3 text-xs font-semibold">
                            {contact.firstName} {contact.lastName}
                          </div>

                          {/* Phone */}
                          <div className="text-xs text-muted-foreground mt-1">
                            {contact.phone}
                          </div>

                          {/* Email */}
                          {contact.email ? (
                            <div
                              title={contact.email}
                              className="text-[11px] text-muted-foreground mt-1 truncate max-w-[150px]"
                            >
                              {contact.email}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground italic mt-1">
                              No email
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewContactGroupModal;
