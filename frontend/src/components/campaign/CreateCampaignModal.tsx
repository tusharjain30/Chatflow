import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Layers, Clock, FileText, Search } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function CreateCampaignModal({ open, setOpen, onSuccess }: any) {
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    description: "",
    templateId: "",
    isScheduled: false,
    scheduledAt: "",
    batchSize: 100,
    delayInSeconds: 3,
  });

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const validateForm = () => {
    if (!form.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      return false;
    }

    if (!selectedTemplate) {
      toast({
        title: "Validation Error",
        description: "Please select a template",
        variant: "destructive",
      });
      return false;
    }

    // 🔥 ALWAYS REQUIRED (backend rule)
    if (!form.scheduledAt) {
      toast({
        title: "Validation Error",
        description: "Scheduled date & time is required",
        variant: "destructive",
      });
      return false;
    }

    const selectedDate = new Date(form.scheduledAt);

    if (isNaN(selectedDate.getTime())) {
      toast({
        title: "Validation Error",
        description: "Invalid date format",
        variant: "destructive",
      });
      return false;
    }

    if (selectedDate <= new Date()) {
      toast({
        title: "Validation Error",
        description: "Scheduled time must be in the future",
        variant: "destructive",
      });
      return false;
    }

    if (form.batchSize <= 0 || form.batchSize > 1000) {
      toast({
        title: "Validation Error",
        description: "Batch size must be between 1 and 1000",
        variant: "destructive",
      });
      return false;
    }

    if (form.delayInSeconds < 0 || form.delayInSeconds > 60) {
      toast({
        title: "Validation Error",
        description: "Delay must be between 0 and 60 seconds",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSwitch = (checked: boolean) => {
    setForm({ ...form, isScheduled: checked });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);

      const token = localStorage.getItem("auth_token");
      const payload = {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        isScheduled: form.isScheduled,
      };

      const res = await axios.post(
        `${API_BASE}/user/campaign/create-campaign`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data?.status === 1) {
        toast({
          title: "🎉 Campaign Created",
          description: res.data.message,
        });

        // setTimeout(() => {
        //   onSuccess && onSuccess();
        // }, 300);

        setOpen(false);
        setForm({
          name: "",
          description: "",
          templateId: "",
          isScheduled: false,
          scheduledAt: "",
          batchSize: 100,
          delayInSeconds: 3,
        });
        onSuccess && onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async (pageNumber = 1, searchValue = "") => {
    try {
      setTemplateLoading(true);

      const token = localStorage.getItem("auth_token");

      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: "6",
      });

      if (searchValue.trim()) {
        params.append("search", searchValue.trim());
      }

      const res = await axios.get(
        `${API_BASE}/user/whatsapp/template/list?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data?.status === 1) {
        setTemplates(res.data.data.templates || []);
        setTotalPages(res.data.data.totalPages || 1);
        setPage(pageNumber);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to fetch templates",
        variant: "destructive",
      });
    } finally {
      setTemplateLoading(false);
    }
  };

  useEffect(() => {
    if (isTemplateModalOpen) {
      setSearch("");
      fetchTemplates();
    }
  }, [isTemplateModalOpen]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (isTemplateModalOpen) {
        fetchTemplates(1, search);
      }
    }, 400); // debounce

    return () => clearTimeout(delay);
  }, [search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] p-6 space-y-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Create Campaign</h2>
          <p className="text-sm text-muted-foreground">
            Configure your broadcast campaign settings
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label>Campaign Name</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className={`pl-9 ${
                  !form.name && loading ? "border-red-500" : ""
                }`}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter campaign name"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter description"
            />
          </div>

          <div className="space-y-2">
            <Label>Template</Label>

            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setIsTemplateModalOpen(true)}
            >
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                {selectedTemplate ? selectedTemplate.name : "Choose Template"}
              </span>
            </Button>

            {selectedTemplate && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedTemplate.name}
              </p>
            )}
          </div>

          {/* Schedule Toggle */}
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <Label>Schedule Campaign</Label>
              <p className="text-xs text-muted-foreground">
                Enable to send campaign later
              </p>
            </div>
            <Switch checked={form.isScheduled} onCheckedChange={handleSwitch} />
          </div>

          {/* Date */}
          {form.isScheduled && (
            <div className="space-y-1">
              <Label>Scheduled At</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="datetime-local"
                  className="pl-9"
                  name="scheduledAt"
                  value={form.scheduledAt}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
          )}

          {/* Batch + Delay */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Batch Size</Label>
              <Input
                type="number"
                name="batchSize"
                value={form.batchSize}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1">
              <Label>Delay (seconds)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  className="pl-9"
                  name="delayInSeconds"
                  value={form.delayInSeconds}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={
              loading || !form.name || !selectedTemplate || !form.scheduledAt
            }
          >
            {loading ? "Creating..." : "Create Campaign"}
          </Button>
        </div>
      </div>

      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[600px] max-h-[500px] overflow-y-auto p-5 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select Template</h3>
              <Button
                variant="ghost"
                onClick={() => setIsTemplateModalOpen(false)}
              >
                ✕
              </Button>
            </div>

            {/* Content */}
            {templateLoading ? (
              <p className="text-center text-sm text-muted-foreground">
                Loading templates...
              </p>
            ) : templates.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No templates found
              </p>
            ) : (
              templates
                .filter((t: any) => t.status === "APPROVED")
                .map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t);
                      setForm({ ...form, templateId: t.id });
                      setIsTemplateModalOpen(false);
                    }}
                    className="border rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{t.name}</h4>

                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                        {t.status}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {t.body}
                    </p>

                    {t.footer?.text && (
                      <p className="text-xs text-gray-400 mt-2">
                        {t.footer.text}
                      </p>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-[950px] max-h-[85vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-green-50 to-white">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-green-100">
                  <Layers className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Select Template</h3>
              </div>

              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => setIsTemplateModalOpen(false)}
              >
                ✕
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b bg-white">
              <div className="relative">
                <Input
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-green-500"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {templateLoading ? (
                <p className="text-center text-sm text-muted-foreground">
                  Loading templates...
                </p>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-3">
                    <FileText className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="text-base font-semibold">No Templates Found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {templates
                    .filter((t: any) => t.status === "APPROVED")
                    .map((t: any) => {
                      const isSelected = selectedTemplate?.id === t.id;

                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTemplate(t);
                            setForm({ ...form, templateId: t.id });
                            setIsTemplateModalOpen(false);
                          }}
                          className={`group border rounded-xl p-4 cursor-pointer transition-all duration-200
                      ${
                        isSelected
                          ? "border-green-500 bg-green-50 shadow-md"
                          : "hover:border-green-300 hover:shadow-md"
                      }
                    `}
                        >
                          {/* Top */}
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium truncate group-hover:text-green-600 transition text-sm">
                              {t.name}
                            </h4>

                            <span className="text-[9px] px-2 py-1 rounded-full bg-green-200 text-green-800 font-medium">
                              {t.status}
                            </span>
                          </div>

                          {/* Body */}
                          <p className="text-muted-foreground mt-2 text-xs leading-relaxed line-clamp-2 break-all">
                            {t.body}
                          </p>

                          {/* Footer */}
                          {t.footer?.text && (
                            <p className="text-xs text-gray-400 mt-3">
                              {t.footer.text}
                            </p>
                          )}

                          {/* Hover Action */}
                          <div className="mt-3 opacity-0 group-hover:opacity-100 transition text-xs text-green-600 font-medium">
                            Click to select →
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t bg-white">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-medium">{page}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-sm"
                  disabled={page === 1}
                  onClick={() => fetchTemplates(page - 1, search)}
                >
                  Previous
                </Button>

                <Button
                  size="sm"
                  className="rounded-sm bg-green-600 hover:bg-green-700 text-white"
                  disabled={page === totalPages}
                  onClick={() => fetchTemplates(page + 1, search)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
