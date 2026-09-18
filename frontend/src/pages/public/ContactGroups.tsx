import { useState, useEffect } from "react";
import { getAuthToken } from "@/utils/authStorage";
import {
  Search,
  Plus,
  MoreVertical,
  Users,
  Pencil,
  Trash2,
  Eye,
  AlertCircle,
  UserMinus,
} from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import CreateContactGroupModal from "@/components/contact-groups/CreateContactGroupModal";
import ViewContactGroupModal from "@/components/contact-groups/ViewContactGroupModal";
import RemoveContactsModal from "@/components/contact-groups/RemoveContactsModal";
import EditContactGroupModal from "@/components/contact-groups/EditContactGroupModal";
import Swal from "sweetalert2";
import { Checkbox } from "@/components/ui/checkbox";
import AssignGroupsModal from "@/components/contact-groups/AssignGroupsModal";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const getAuthHeaders = () => {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

type Group = {
  id: string;
  title: string;
  description: string | null;
  contactsCount: number;
  createdAt: string;
};

const ContactGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [openCreateModal, setOpenCreateModal] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [openViewModal, setOpenViewModal] = useState(false);
  const [viewGroupId, setViewGroupId] = useState<string | null>(null);

  const [openRemoveModal, setOpenRemoveModal] = useState(false);
  const [removeGroupId, setRemoveGroupId] = useState<string | null>(null);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState<string | null>(null);

  const [selected, setSelected] = useState<string[]>([]);
  const [openAssignModal, setOpenAssignModal] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = search.trim();
      setDebouncedSearch(value);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchGroups = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const res = await fetch(
        `${API_BASE}/user/contacts/groups/read?${params.toString()}`,
        {
          headers: getAuthHeaders(),
        },
      );

      const json = await res.json();

      if (res.ok && json.status === 1) {
        setGroups(json.data?.items || []);
        setTotal(json.data?.pagination?.total || 0);
        setTotalPages(json.data?.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    const result = await Swal.fire({
      title: "Delete Group?",
      text: "This action will permanently delete the group.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/user/contacts/groups/delete/${groupId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      const json = await res.json();

      if (res.ok && json.status === 1) {
        await Swal.fire({
          icon: "success",
          title: "Deleted",
          text: json.message,
          timer: 1500,
          showConfirmButton: false,
        });

        fetchGroups();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: json.message || "Failed to delete group",
        });
      }
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong",
      });
    }
  };

  const bulkDeleteGroups = async () => {
    if (selected.length === 0) return;

    const result = await Swal.fire({
      title: "Delete Selected Groups?",
      text: `You are about to delete ${selected.length} group(s).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/user/contacts/groups/bulk-delete`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          groupIds: selected,
        }),
      });

      const json = await res.json();

      if (res.ok && json.status === 1) {
        await Swal.fire({
          icon: "success",
          title: "Deleted",
          text: `${json.data.deletedCount} group(s) deleted`,
          timer: 1500,
          showConfirmButton: false,
        });

        setSelected([]);
        fetchGroups();
      }
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong",
      });
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [page, limit, debouncedSearch]);

  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Contact Groups</h1>
                <p className="text-xs text-muted-foreground">
                  Organize contacts into groups
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Assign Groups Button */}
                {selected.length !== 0 && (
                  <Button
                    onClick={() => setOpenAssignModal(true)}
                    className="bg-gradient-to-r from-[#134E4A] to-[#0f766e] text-white gap-2 text-xs"
                  >
                    <Users className="h-4 w-4" />
                    Assign Groups to Contacts
                  </Button>
                )}

                {/* Create Group */}
                <Button
                  className="gradient-whatsapp text-primary-foreground gap-2 text-xs"
                  onClick={() => setOpenCreateModal(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create Group
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="card-elevated p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                  <Input
                    placeholder="Search groups..."
                    className="pl-10 pr-8 bg-muted/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500 transition"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows:</span>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Rows: {limit}
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent>
                      {[5, 10, 20, 50].map((size) => (
                        <DropdownMenuItem
                          key={size}
                          onClick={() => {
                            setLimit(size);
                            setPage(1);
                          }}
                        >
                          {size} rows
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {selected.length > 0 && (
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                <span className="text-red-600 text-sm">
                  {selected.length} group(s) selected
                </span>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={bulkDeleteGroups}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Bulk Delete
                </Button>
              </div>
            )}

            {/* Groups Table */}
            <div className="card-elevated overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/40">
                  <tr className="border-b border-border">
                    <th className="px-4 py-4 w-10">
                      <Checkbox
                        checked={
                          selected.length === groups.length && groups.length > 0
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelected(groups.map((g) => g.id));
                          } else {
                            setSelected([]);
                          }
                        }}
                      />
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Group Name
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Description
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Contacts
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Created
                    </th>

                    <th className="px-4 py-4 w-10"></th>
                  </tr>
                </thead>

                <tbody>
                  {loading &&
                    Array.from({ length: limit }).map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="px-4 py-4">
                          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        </td>

                        <td className="px-4 py-4">
                          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                        </td>

                        <td className="px-4 py-4">
                          <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                        </td>

                        <td className="px-4 py-4">
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </td>

                        <td className="px-4 py-4">
                          <div className="h-6 w-6 bg-muted animate-pulse rounded" />
                        </td>
                      </tr>
                    ))}

                  {!loading && groups.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10">
                        <div className="flex justify-center">
                          <div className="w-full max-w-md border-2 border-dashed border-red-300 bg-red-50/40 rounded-lg p-6 flex flex-col items-center gap-3 text-center">
                            <AlertCircle className="h-8 w-8 text-red-500" />

                            <span className="text-sm font-semibold text-red-600">
                              No groups found
                            </span>

                            <p className="text-xs text-muted-foreground">
                              Create your first contact group
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    groups.map((group) => (
                      <tr
                        key={group.id}
                        className="border-b hover:bg-muted/40 transition"
                      >
                        <td className="px-4 py-4">
                          <Checkbox
                            checked={selected.includes(group.id)}
                            onCheckedChange={() => {
                              setSelected((prev) =>
                                prev.includes(group.id)
                                  ? prev.filter((id) => id !== group.id)
                                  : [...prev, group.id],
                              );
                            }}
                          />
                        </td>

                        <td className="px-4 py-4 font-medium text-sm">
                          {group.title}
                        </td>

                        <td className="px-4 py-4 text-sm max-w-[250px]">
                          {group.description ? (
                            <span
                              className="text-muted-foreground block truncate"
                              title={group.description}
                            >
                              {group.description}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 italic">
                              No description
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <Badge variant="secondary">
                            <Users className="h-3 w-3 mr-1" />
                            {group.contactsCount}
                          </Badge>
                        </td>

                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {new Date(group.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                  setViewGroupId(group.id);
                                  setOpenViewModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => {
                                  setEditGroupId(group.id);
                                  setEditTitle(group.title);
                                  setEditDescription(group.description);
                                  setOpenEditModal(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled={group.contactsCount === 0}
                                className={`flex items-center gap-2 cursor-pointer ${
                                  group.contactsCount === 0
                                    ? "text-muted-foreground cursor-not-allowed"
                                    : "text-orange-600"
                                }`}
                                onClick={() => {
                                  if (group.contactsCount === 0) return;

                                  setRemoveGroupId(group.id);
                                  setOpenRemoveModal(true);
                                }}
                              >
                                <Users className="h-4 w-4" />
                                Remove Contacts
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="flex items-center gap-2 text-red-600"
                                onClick={() => deleteGroup(group.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {total > 0
                  ? `Showing ${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total} groups`
                  : "No groups"}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1 || loading}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages || loading}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </main>

        <CreateContactGroupModal
          open={openCreateModal}
          onClose={() => setOpenCreateModal(false)}
          onSuccess={() => {
            setOpenCreateModal(false);
            fetchGroups();
          }}
        />

        <ViewContactGroupModal
          open={openViewModal}
          groupId={viewGroupId}
          onClose={() => setOpenViewModal(false)}
        />

        <RemoveContactsModal
          open={openRemoveModal}
          groupId={removeGroupId}
          onClose={() => setOpenRemoveModal(false)}
          onSuccess={() => {
            fetchGroups();
          }}
        />

        <EditContactGroupModal
          open={openEditModal}
          groupId={editGroupId}
          initialTitle={editTitle}
          initialDescription={editDescription}
          onClose={() => setOpenEditModal(false)}
          onSuccess={fetchGroups}
        />

        <AssignGroupsModal
          open={openAssignModal}
          onClose={() => setOpenAssignModal(false)}
          groupIds={selected}
          onSuccess={() => {
            fetchGroups();
            setSelected([]);
          }}
        />
      </div>
    </div>
  );
};

export default ContactGroups;
