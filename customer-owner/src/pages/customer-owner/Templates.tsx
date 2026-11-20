import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle,
  Clock,
  Copy,
  Edit,
  Eye,
  File,
  FolderOpen,
  Info,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmModal } from "@/components/shared/Modal";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/utils/authStorage";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type TemplateStatus = "approved" | "pending" | "rejected" | "draft";
type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";
type TemplateButtonType = "QUICK_REPLY" | "URL" | "CALL";

type TemplateButton = {
  type: TemplateButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
};

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  status: TemplateStatus;
  content: string;
  language: string;
  createdAt: string;
  updatedAt?: string;
  headerText?: string;
  footerText?: string;
  buttons?: TemplateButton[];
}

type ApiTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  language: string;
  body: string;
  header?: { type?: string; text?: string } | null;
  footer?: { text?: string } | null;
  buttons?: TemplateButton[] | null;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt?: string;
};

const categoryOptions: Array<{ value: TemplateCategory; label: string }> = [
  { value: "MARKETING", label: "Marketing" },
  { value: "UTILITY", label: "Utility" },
  { value: "AUTHENTICATION", label: "Authentication" },
];

const formatLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const mapStatus = (status: ApiTemplate["status"]): TemplateStatus => {
  if (status === "APPROVED") return "approved";
  if (status === "REJECTED") return "rejected";
  if (status === "SUBMITTED") return "pending";
  return "draft";
};

const mapTemplate = (template: ApiTemplate): Template => ({
  id: template.id,
  name: template.name,
  category: template.category,
  status: mapStatus(template.status),
  content: template.body || "",
  language: template.language,
  createdAt: template.createdAt,
  updatedAt: template.updatedAt,
  headerText:
    template.header?.type === "TEXT" ? template.header.text || "" : undefined,
  footerText: template.footer?.text || undefined,
  buttons: template.buttons || [],
});

function authHeaders() {
  return { Authorization: `Bearer ${getAuthToken()}` };
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: TemplateStatus }) {
  const Icon =
    status === "approved"
      ? CheckCircle
      : status === "pending"
        ? Clock
        : status === "rejected"
          ? XCircle
          : File;

  return (
    <Badge
      className={cn(
        "font-medium gap-1",
        status === "approved" && "bg-green-100 text-green-800 hover:bg-green-100",
        status === "pending" &&
          "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        status === "rejected" && "bg-red-100 text-red-800 hover:bg-red-100",
        status === "draft" && "bg-slate-100 text-slate-700 hover:bg-slate-100",
      )}
    >
      <Icon className="h-3 w-3" />
      {formatLabel(status)}
    </Badge>
  );
}

export default function Templates() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [waLabel, setWaLabel] = useState("WhatsApp");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter]);

  const loadWhatsApp = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/user/account/whatsapp-integration`,
        { headers: authHeaders() },
      );
      const accounts = res.data?.data?.accounts || [];
      const active =
        accounts.find((a: any) => a.isActive && a.status === "ACTIVE") ||
        accounts[0];
      if (active) {
        setWaLabel(
          active.displayName || active.phoneNumber || "WhatsApp Connected",
        );
      } else {
        setWaLabel("No WhatsApp connected");
      }
    } catch {
      setWaLabel("WhatsApp");
    }
  }, []);

  const fetchTemplates = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (categoryFilter !== "all") params.set("category", categoryFilter);

        const res = await axios.get(
          `${API_BASE}/user/whatsapp/template/list?${params.toString()}`,
          { headers: authHeaders() },
        );

        if (res.data?.status !== 1) {
          throw new Error(res.data?.message || "Failed to fetch templates");
        }

        const items: Template[] = (res.data.data?.templates || []).map(
          mapTemplate,
        );
        setTemplates(items);
        setTotalPages(res.data.data?.totalPages || 1);
        setTotal(res.data.data?.total || items.length);
      } catch (error: any) {
        toast({
          title: "Unable to load templates",
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Please try again",
          variant: "destructive",
        });
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [categoryFilter, debouncedSearch, page, toast],
  );

  useEffect(() => {
    loadWhatsApp();
  }, [loadWhatsApp]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await Promise.all([fetchTemplates({ silent: true }), loadWhatsApp()]);
      toast({
        title: "Templates synced",
        description: "Latest templates loaded from your account.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmitToMeta = async (template: Template) => {
    try {
      setBusyId(template.id);
      const res = await axios.post(
        `${API_BASE}/user/whatsapp/template/submit`,
        { templateId: template.id },
        { headers: authHeaders() },
      );
      if (res.data?.status !== 1) {
        throw new Error(res.data?.message || "Failed to submit template");
      }
      toast({
        title: "Submitted to Meta",
        description:
          res.data?.message || "Template submitted for WhatsApp approval.",
      });
      await fetchTemplates({ silent: true });
    } catch (error: any) {
      toast({
        title: "Submit failed",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to submit template",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      setBusyId(template.id);
      const res = await axios.post(
        `${API_BASE}/user/whatsapp/template/duplicate`,
        { templateId: template.id },
        { headers: authHeaders() },
      );
      if (res.data?.status !== 1) {
        throw new Error(res.data?.message || "Failed to duplicate template");
      }
      toast({
        title: "Template duplicated",
        description: res.data?.message || "Template duplicated successfully.",
      });
      await fetchTemplates({ silent: true });
    } catch (error: any) {
      toast({
        title: "Duplicate failed",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to duplicate template",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await axios.delete(
        `${API_BASE}/user/whatsapp/template/delete`,
        {
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
          data: { templateId: pendingDelete.id },
        },
      );
      if (res.data?.status !== 1) {
        throw new Error(res.data?.message || "Failed to delete template");
      }
      toast({
        title: "Template deleted",
        description: pendingDelete.name,
      });
      setDeleteOpen(false);
      setPendingDelete(null);
      await fetchTemplates({ silent: true });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to delete template",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const gridCols =
    "grid-cols-[1.3fr_1.1fr_0.8fr_1.6fr_0.85fr_0.9fr_48px]";

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header title="Message Templates" subtitle="Add Template" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Message Templates
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Add Template
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="border-slate-200"
                onClick={handleSync}
                disabled={syncing || loading}
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Templates
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => navigate("/templates/create", { state: null })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search templates..."
                className="pl-9 h-11 rounded-lg bg-white border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search !== debouncedSearch && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-11 bg-white border-slate-200">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden min-h-[420px]">
            <div
              className={cn(
                "hidden md:grid gap-2 px-5 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500",
                gridCols,
              )}
            >
              <span>Name</span>
              <span>WhatsApp Instance</span>
              <span>Category</span>
              <span>Preview</span>
              <span>Status</span>
              <span>Last Updated</span>
              <span />
            </div>

            {loading ? (
              <div className="py-24 flex items-center justify-center gap-2 text-slate-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <FolderOpen className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-800">
                  You Don&apos;t Have Any Templates
                </p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  Create a WhatsApp message template to use in campaigns and
                  automated replies.
                </p>
                <Button
                  className="mt-5 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => navigate("/templates/create", { state: null })}
                >
                  Create Template
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      "grid gap-2 px-5 py-4 items-center hover:bg-slate-50/80",
                      "grid-cols-1 md:grid-cols-[1.3fr_1.1fr_0.8fr_1.6fr_0.85fr_0.9fr_48px]",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="md:hidden text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">
                        Name
                      </p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {template.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatLabel(template.language)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="md:hidden text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">
                        WhatsApp Instance
                      </p>
                      <p className="text-sm text-slate-600 truncate">{waLabel}</p>
                    </div>

                    <div>
                      <p className="md:hidden text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">
                        Category
                      </p>
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1">
                        {formatLabel(template.category)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="md:hidden text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">
                        Preview
                      </p>
                      <p className="text-sm text-slate-600 line-clamp-2 break-words">
                        {template.content || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="md:hidden text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">
                        Status
                      </p>
                      <StatusBadge status={template.status} />
                    </div>

                    <div>
                      <p className="md:hidden text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">
                        Last Updated
                      </p>
                      <p className="text-sm text-slate-600">
                        {formatDate(template.updatedAt || template.createdAt)}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={busyId === template.id}
                          >
                            {busyId === template.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/templates/preview/${template.id}`, {
                                state: { template },
                              })
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={template.status === "approved"}
                            onClick={() =>
                              navigate("/templates/create", {
                                state: { template },
                              })
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {(template.status === "draft" ||
                            template.status === "rejected") && (
                            <DropdownMenuItem
                              onClick={() => handleSubmitToMeta(template)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Submit for approval
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(template)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setPendingDelete(template);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && templates.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
                {total ? ` · ${total} templates` : ""}
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
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setPendingDelete(null);
        }}
        title="Delete template?"
        description={`This will permanently delete “${pendingDelete?.name || "this template"}”.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
