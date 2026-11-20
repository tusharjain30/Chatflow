import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/shared/Modal";
import { getAuthToken } from "@/utils/authStorage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  Copy,
  Edit,
  Eye,
  File,
  FileText,
  Image,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Swal from "sweetalert2";
import { FiBarChart2, FiCheckCircle, FiClock, FiLayers } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type TemplateStatus = "approved" | "pending" | "rejected" | "draft";
type TemplateType = "text" | "media" | "interactive";
type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";
type TemplateButtonType = "QUICK_REPLY" | "URL" | "CALL";

type TemplateButton = {
  type: TemplateButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
};

interface Template {
  id: number | string;
  name: string;
  category: TemplateCategory;
  type: TemplateType;
  status: TemplateStatus;
  content: string;
  language: string;
  usageCount: number;
  createdAt: string;
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
  mediaFiles?: unknown[] | null;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  createdAt: string;
};

const statusStyles: Record<TemplateStatus, string> = {
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

const statusIcons = {
  approved: CheckCircle,
  pending: Clock,
  rejected: XCircle,
  draft: File,
};
const typeIcons = { text: MessageSquare, media: Image, interactive: FileText };
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

const mapType = (template: ApiTemplate): TemplateType => {
  if (
    (template.buttons && template.buttons.length > 0) ||
    template.header?.type === "LOCATION"
  ) {
    return "interactive";
  }

  if (
    template.header &&
    ["IMAGE", "VIDEO", "DOCUMENT"].includes(template.header.type || "")
  ) {
    return "media";
  }

  return "text";
};

const mapTemplate = (template: ApiTemplate): Template => ({
  id: template.id,
  name: template.name,
  category: template.category,
  type: mapType(template),
  status: mapStatus(template.status),
  content: template.body,
  language: template.language,
  usageCount: 0,
  createdAt: template.createdAt,
  headerText:
    template.header?.type === "TEXT" ? template.header.text || "" : undefined,
  footerText: template.footer?.text || undefined,
  buttons: template.buttons || [],
});

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [duplicatingTemplateId, setDuplicatingTemplateId] = useState<
    string | number | null
  >(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<
    string | number | null
  >(null);
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const res = await fetch(
        `${API_BASE}/user/whatsapp/template/list?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const json = await res.json();
      if (!res.ok || json.status !== 1) {
        throw new Error(json.message || "Failed to fetch templates");
      }

      const items: Template[] = (json.data?.templates || []).map(mapTemplate);
      setTemplates(items);
      setTotalPages(json.data?.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter, searchQuery, page, toast]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryFilter]);

  const filteredTemplates = templates;

  const handleEdit = () => {
    if (!selectedTemplate) return;
    setTemplates(
      templates.map((t) =>
        t.id === selectedTemplate.id
          ? { ...selectedTemplate, status: "pending" as const }
          : t,
      ),
    );
    setIsEditModalOpen(false);
    toast({
      title: "Template updated",
      description: "UI updated locally. Connect edit API next if needed.",
    });
  };

  const handleDelete = async (template: Template) => {
    const result = await Swal.fire({
      title: "Delete template?",
      text: `You are about to delete ${template.name}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingTemplateId(template.id);
      const token = getAuthToken();

      const res = await fetch(`${API_BASE}/user/whatsapp/template/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ templateId: template.id }),
      });

      const json = await res.json();
      if (!res.ok || json.status !== 1) {
        throw new Error(json.message || "Failed to delete template");
      }

      setTemplates((current) => current.filter((t) => t.id !== template.id));
      setSelectedTemplate((current) =>
        current?.id === template.id ? null : current,
      );
      toast({
        title: "Template deleted",
        description: json.message || "Template deleted successfully.",
        variant: "destructive",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      setDuplicatingTemplateId(template.id);
      const token = getAuthToken();

      const res = await fetch(`${API_BASE}/user/whatsapp/template/duplicate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ templateId: template.id }),
      });

      const json = await res.json();
      if (!res.ok || json.status !== 1) {
        throw new Error(json.message || "Failed to duplicate template");
      }

      const duplicatedTemplate = mapTemplate(json.data);
      setTemplates((current) => [duplicatedTemplate, ...current]);
      fetchTemplates();
      toast({
        title: "Template duplicated",
        description: json.message || "Template duplicated successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to duplicate template",
        variant: "destructive",
      });
    } finally {
      setDuplicatingTemplateId(null);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header />
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Message Templates
              </h1>
              <p className="text-muted-foreground">
                Create and manage WhatsApp-approved message templates
              </p>
            </div>
            <Button
              onClick={() => navigate("/templates/create", { state: null })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {/* TOTAL */}
            <Card className="group relative rounded-2xl p-4 bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Templates
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition">
                  <FiLayers className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">
                  {templates.length}
                </div>
              </CardContent>
            </Card>

            {/* APPROVED */}
            <Card className="group relative rounded-2xl p-4 bg-gradient-to-br from-green-50 to-green-100/60 border border-green-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-100 text-green-600 group-hover:scale-110 transition">
                  <FiCheckCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">
                  {templates.filter((t) => t.status === "approved").length}
                </div>
              </CardContent>
            </Card>

            {/* PENDING */}
            <Card className="group relative rounded-2xl p-4 bg-gradient-to-br from-yellow-50 to-yellow-100/60 border border-yellow-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending
                </CardTitle>
                <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 group-hover:scale-110 transition">
                  <FiClock className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-700">
                  {
                    templates.filter(
                      (t) => t.status === "pending" || t.status === "draft",
                    ).length
                  }
                </div>
              </CardContent>
            </Card>

            {/* USAGE */}
            <Card className="group relative rounded-2xl p-4 bg-gradient-to-br from-purple-50 to-purple-100/60 border border-purple-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Usage
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:scale-110 transition">
                  <FiBarChart2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700">
                  {templates
                    .reduce((acc, t) => acc + t.usageCount, 0)
                    .toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
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

          {isLoading ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              Loading templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/70 p-8 text-center dark:border-sky-900 dark:bg-sky-950/20">
              <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                <div className="rounded-full bg-white p-3 shadow-sm dark:bg-slate-900">
                  <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-sky-900 dark:text-sky-100">
                    No templates found
                  </p>
                  <p className="text-sm text-sky-700 dark:text-sky-300">
                    Try changing your filters or create a new template to get
                    started.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => {
                  const StatusIcon = statusIcons[template.status];
                  const TypeIcon = typeIcons[template.type];
                  return (
                    <Card
                      key={template.id}
                      className="group border rounded-2xl p-4 hover:shadow-lg hover:border-primary/40 transition-all duration-200 bg-white"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                            <TypeIcon className="h-4 w-4 text-primary" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {template.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatLabel(template.category)}
                            </p>
                          </div>
                        </div>

                        <Badge
                          className={`${statusStyles[template.status]} text-[10px] px-2 py-0.5`}
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {formatLabel(template.status)}
                        </Badge>
                      </div>

                      {/* Body */}
                      <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 break-words group-hover:line-clamp-3 transition-all">
                        {template.content}
                      </p>

                      {/* Buttons */}
                      {template.buttons && template.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.buttons.slice(0, 2).map((button, index) => (
                            <span
                              key={index}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              {button.text}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-3">
                        <span>{formatLabel(template.language)}</span>
                        <span className="font-medium">
                          {template.usageCount}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 mt-3 opacity-80 group-hover:opacity-100 transition">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-[11px] h-8"
                          onClick={() => {
                            navigate(`/templates/preview/${template.id}`, {
                              state: { template },
                            });
                          }}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Preview
                        </Button>

                        <Button
                          disabled={template.status === "approved"}
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            navigate("/templates/create", {
                              state: { template },
                            });
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={duplicatingTemplateId === template.id}
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={deletingTemplateId === template.id}
                          onClick={() => handleDelete(template)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
