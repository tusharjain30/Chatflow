import { useState, useEffect } from "react";
import { getAuthToken } from "@/utils/authStorage";
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  AlertCircle,
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

import Swal from "sweetalert2";
import { Checkbox } from "@/components/ui/checkbox";
import CreateCustomFieldModal from "@/components/contact-custom-fields/CreateCustomFieldModal";
import EditCustomFieldModal from "@/components/contact-custom-fields/EditCustomFieldModal";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const getAuthHeaders = () => {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

type CustomField = {
  id: string;
  name: string;
  key: string;
  type: string;
  createdAt: string;
};

const ContactFields = () => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selected, setSelected] = useState<string[]>([]);
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedField, setSelectedField] = useState<any>(null);

  /* ---------------- DEBOUNCE ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- FETCH ---------------- */
  const fetchFields = async () => {
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
        `${API_BASE}/user/contacts/custom-fields/list?${params.toString()}`,
        {
          headers: getAuthHeaders(),
        },
      );

      const json = await res.json();

      if (res.ok && json.status === 1) {
        setFields(json.data?.items || []);
        setTotal(json.data?.pagination?.total || 0);
        setTotalPages(json.data?.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch fields:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [page, limit, debouncedSearch]);

  /* ---------------- DELETE ---------------- */
  const deleteField = async (fieldId: string) => {
    const result = await Swal.fire({
      title: "Delete Custom Field?",
      text: "All associated data will also be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/user/contacts/custom-fields/delete/${fieldId}`,
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

        fetchFields(); // refresh list
        setSelected([]); // optional reset
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: json.message || "Failed to delete field",
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

  const bulkDeleteFields = async () => {
    if (selected.length === 0) {
      return Swal.fire({
        icon: "warning",
        title: "No fields selected",
        text: "Please select at least one field",
      });
    }

    const result = await Swal.fire({
      title: `Delete ${selected.length} field(s)?`,
      text: "All associated data will also be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete all",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/user/contacts/custom-fields/bulk-delete`,
        {
          method: "DELETE", // ✅ your API
          headers: getAuthHeaders(),
          body: JSON.stringify({
            fieldIds: selected,
          }),
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

        setSelected([]);
        fetchFields();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: json.message || "Bulk delete failed",
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
                <h1 className="text-xl font-bold">Contact Fields</h1>
                <p className="text-xs text-muted-foreground">
                  Manage custom fields for contacts
                </p>
              </div>

              <Button
                className="gradient-whatsapp text-primary-foreground gap-2 text-xs"
                onClick={() => setOpenCreateModal(true)}
              >
                <Plus className="h-4 w-4" />
                Create Field
              </Button>
            </div>

            {/* Search */}
            <div className="card-elevated p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  {/* Search Icon */}
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                  {/* Input */}
                  <Input
                    placeholder="Search fields..."
                    className="pl-10 pr-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  {/* Clear Button */}
                  {search && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setDebouncedSearch("");
                        setPage(1);
                      }}
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
              <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                <span className="text-sm font-medium">
                  {selected.length} field(s) selected
                </span>

                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={bulkDeleteFields}
                >
                  <Trash2 className="h-4 w-4" />
                  Bulk Delete
                </Button>
              </div>
            )}

            {/* Table */}
            <div className="card-elevated overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/40">
                  <tr className="border-b border-border">
                    <th className="px-4 py-4 w-10">
                      <Checkbox
                        checked={
                          selected.length === fields.length && fields.length > 0
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelected(fields.map((f) => f.id));
                          } else {
                            setSelected([]);
                          }
                        }}
                      />
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Field Name
                    </th>

                    {/* <th className="px-4 py-4 text-left text-xs">Key</th> */}

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase text-muted-foreground">
                      Type
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
                        <td className="px-4 py-4" colSpan={6}>
                          <div className="h-4 w-full bg-muted animate-pulse rounded" />
                        </td>
                      </tr>
                    ))}

                  {!loading && fields.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-red-200 rounded-xl p-10 bg-red-50/40">
                          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                          </div>

                          <h3 className="text-sm font-semibold text-red-600">
                            No custom fields found
                          </h3>

                          <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
                            Try adjusting your search or create a new custom
                            field.
                          </p>

                          {/* <Button
                            size="sm"
                            className="mt-4 gap-2 gradient-whatsapp text-primary-foreground"
                            onClick={() => setOpenCreateModal(true)}
                          >
                            <Plus className="h-4 w-4" />
                            Create Field
                          </Button> */}
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    fields.map((field) => (
                      <tr key={field.id} className="border-b">
                        <td className="px-4 py-4">
                          <Checkbox
                            checked={selected.includes(field.id)}
                            onCheckedChange={() => {
                              setSelected((prev) =>
                                prev.includes(field.id)
                                  ? prev.filter((id) => id !== field.id)
                                  : [...prev, field.id],
                              );
                            }}
                          />
                        </td>

                        <td className="px-4 py-4 font-medium text-sm">
                          {field.name}
                        </td>

                        {/* <td className="px-4 py-4 text-muted-foreground">
                          {field.key}
                        </td> */}

                        <td className="px-4 py-4 text-sm">
                          <Badge variant="secondary">{field.type}</Badge>
                        </td>

                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {new Date(field.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              {/* <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem> */}

                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedField(field);
                                  setOpenEditModal(true);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => deleteField(field.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
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
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                {total > 0
                  ? `Showing ${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total}`
                  : "No data"}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
          <CreateCustomFieldModal
            open={openCreateModal}
            onClose={() => setOpenCreateModal(false)}
            onSuccess={fetchFields} // refresh list
          />

          <EditCustomFieldModal
            open={openEditModal}
            onClose={() => setOpenEditModal(false)}
            field={selectedField}
            onSuccess={fetchFields}
          />
        </main>
      </div>
    </div>
  );
};

export default ContactFields;
