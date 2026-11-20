import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type Template = {
  id: string;
  name: string;
  body?: string;
  status?: string;
};

type Group = {
  id: string;
  title: string;
  contactsCount?: number;
};

function authHeaders() {
  return { Authorization: `Bearer ${getAuthToken()}` };
}

function toIsoLocal(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export default function BroadcastCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewId = searchParams.get("id");
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [message, setMessage] = useState("");
  const [sendTo, setSendTo] = useState<string>("all");
  const [scheduledAt, setScheduledAt] = useState("");
  const [sendImmediately, setSendImmediately] = useState(true);
  const [attachmentType, setAttachmentType] = useState<
    "Image" | "Video" | "Document"
  >("Image");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(
    null,
  );
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [waLabel, setWaLabel] = useState("Default WhatsApp");
  const [viewMode, setViewMode] = useState(false);

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      try {
        const [templatesRes, groupsRes, waRes] = await Promise.all([
          axios.get(
            `${API_BASE}/user/whatsapp/template/list?page=1&limit=50`,
            { headers: authHeaders() },
          ),
          axios.get(
            `${API_BASE}/user/contacts/groups/read?page=1&limit=100`,
            { headers: authHeaders() },
          ),
          axios
            .get(`${API_BASE}/user/account/whatsapp-integration`, {
              headers: authHeaders(),
            })
            .catch(() => null),
        ]);

        const nextTemplates: Template[] =
          templatesRes.data?.data?.templates ||
          templatesRes.data?.data?.items ||
          [];
        setTemplates(
          nextTemplates.filter(
            (t) =>
              !t.status ||
              String(t.status).toUpperCase() === "APPROVED",
          ),
        );

        setGroups(groupsRes.data?.data?.items || []);

        const accounts = waRes?.data?.data?.accounts || [];
        const active = accounts.find(
          (a: any) => a.isActive && a.status === "ACTIVE",
        );
        if (active) {
          setWaLabel(
            `${active.displayName || active.phoneNumber || "WhatsApp"} (Connected)`,
          );
        } else {
          setWaLabel("No WhatsApp connected");
        }

        if (viewId) {
          setViewMode(true);
          const detail = await axios.get(
            `${API_BASE}/user/campaign/detail/${viewId}`,
            { headers: authHeaders() },
          );
          const campaign = detail.data?.data;
          if (campaign) {
            setName(campaign.name || "");
            const tid = campaign.templateId || campaign.template?.id || "";
            setTemplateId(tid);
            setMessage(
              campaign.template?.body ||
                campaign.description ||
                "",
            );
            setSendImmediately(!campaign.isScheduled);
            if (campaign.scheduledAt) {
              const d = new Date(campaign.scheduledAt);
              const offset = d.getTimezoneOffset();
              setScheduledAt(
                new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16),
              );
            }
          }
        }
      } catch (error: any) {
        toast({
          title: "Unable to load form",
          description: error?.response?.data?.message || "Please try again",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, [toast, viewId]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) || null,
    [templates, templateId],
  );

  useEffect(() => {
    return () => {
      if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
    };
  }, [attachmentPreviewUrl]);

  const applyTemplateBody = (body?: string | null) => {
    const text = (body || "").trim();
    setMessage(text);
  };

  const handleTemplateSelect = async (id: string) => {
    if (id === "__none") {
      setTemplateId("");
      setMessage("");
      return;
    }

    setTemplateId(id);
    const local = templates.find((t) => t.id === id);
    if (local?.body?.trim()) {
      applyTemplateBody(local.body);
      return;
    }

    setLoadingTemplate(true);
    try {
      const res = await axios.get(
        `${API_BASE}/user/whatsapp/template/detail/${id}`,
        { headers: authHeaders() },
      );
      const detail = res.data?.data;
      const body = detail?.body || "";
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, body } : t)),
      );
      applyTemplateBody(body);
    } catch (error: any) {
      toast({
        title: "Unable to load template",
        description:
          error?.response?.data?.message || "Please select another template",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleAttachmentChange = (file: File | null) => {
    if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
    setAttachmentFile(file);
    if (file && attachmentType === "Image" && file.type.startsWith("image/")) {
      setAttachmentPreviewUrl(URL.createObjectURL(file));
    } else {
      setAttachmentPreviewUrl(null);
    }
  };

  const attachmentHint =
    attachmentType === "Image"
      ? "JPG or PNG, max 5 MB"
      : attachmentType === "Video"
        ? "MP4, max 16 MB"
        : "PDF or DOC, max 16 MB";

  const previewText =
    message.trim() || "Your campaign message preview will appear here.";

  const previewTime = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const handleSave = async () => {
    if (viewMode) {
      navigate("/broadcasts");
      return;
    }

    if (!name.trim() || name.trim().length < 3) {
      toast({
        title: "Validation",
        description: "Campaign name must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }
    if (!templateId) {
      toast({
        title: "Validation",
        description: "Please select a message template",
        variant: "destructive",
      });
      return;
    }
    if (!sendImmediately && !scheduledAt) {
      toast({
        title: "Validation",
        description: "Choose a scheduled time or send immediately",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const createRes = await axios.post(
        `${API_BASE}/user/campaign/create-campaign`,
        {
          name: name.trim(),
          description: message.trim() || undefined,
          templateId,
          isScheduled: false,
          batchSize: 50,
          delayInSeconds: 2,
        },
        { headers: authHeaders() },
      );

      if (createRes.data?.status !== 1) {
        throw new Error(createRes.data?.message || "Create failed");
      }

      const campaignId = createRes.data.data.id as string;

      // Audience
      if (sendTo === "all") {
        const contactsRes = await axios.get(
          `${API_BASE}/user/contacts/contact/read?page=1&limit=500`,
          { headers: authHeaders() },
        );
        const contactIds = (contactsRes.data?.data?.contacts || [])
          .map((c: any) => c.id)
          .filter(Boolean);
        if (contactIds.length) {
          await axios.post(
            `${API_BASE}/user/campaign/audience`,
            { campaignId, contactIds },
            { headers: authHeaders() },
          );
        }
      } else {
        await axios.post(
          `${API_BASE}/user/campaign/audience`,
          { campaignId, groupIds: [sendTo] },
          { headers: authHeaders() },
        );
      }

      if (!sendImmediately && scheduledAt) {
        const iso = toIsoLocal(scheduledAt);
        await axios.put(
          `${API_BASE}/user/campaign/${campaignId}/update`,
          {
            isScheduled: true,
            scheduledAt: iso,
          },
          { headers: authHeaders() },
        );
      }

      if (sendImmediately) {
        try {
          await axios.post(
            `${API_BASE}/user/campaign/start`,
            { campaignId },
            { headers: authHeaders() },
          );
        } catch (startError: any) {
          // Draft with audience is still useful if start fails (e.g. no audience)
          toast({
            title: "Campaign saved",
            description:
              startError?.response?.data?.message ||
              "Created as draft. Add audience/start from campaigns list if needed.",
          });
          navigate("/broadcasts");
          return;
        }
      }

      toast({
        title: sendImmediately ? "Campaign started" : "Campaign scheduled",
        description: `${name.trim()} is ready.`,
      });
      navigate("/broadcasts");
    } catch (error: any) {
      toast({
        title: "Save failed",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to create campaign",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header
        title={viewMode ? "Campaign" : "New Campaign"}
        subtitle="Create Campaign"
      />
      <main className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col">
        <div className="max-w-6xl mx-auto w-full flex-1 min-h-0 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {viewMode ? "View Campaign" : "New Campaign"}
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Create Campaign
              </p>
            </div>
            <Button
              className="bg-slate-900 hover:bg-slate-800 text-white"
              onClick={() => navigate("/broadcasts")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-5 flex-1 min-h-0 items-stretch">
            {/* Form box — left pane with its own scrollbar */}
            <div className="flex flex-col min-h-0 h-full max-h-[calc(100vh-11.5rem)] rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="campaign-form-scroll flex-1 min-h-0 overflow-y-scroll overscroll-contain p-5 space-y-4">
                <div className="space-y-2">
                  <Label>Campaign name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Demo"
                    disabled={viewMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp instance</Label>
                  <Input value={waLabel} disabled className="bg-slate-50" />
                </div>

                <div className="space-y-2">
                  <Label>Send To</Label>
                  <Select
                    value={sendTo}
                    onValueChange={setSendTo}
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Contacts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">all contacts</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.title}
                          {typeof group.contactsCount === "number"
                            ? ` (${group.contactsCount})`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scheduled Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    disabled={viewMode || sendImmediately}
                    className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600 pt-1">
                    <Checkbox
                      checked={sendImmediately}
                      disabled={viewMode}
                      onCheckedChange={(checked) =>
                        setSendImmediately(Boolean(checked))
                      }
                    />
                    Skip scheduling & send immediately
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>Message template</Label>
                  <Select
                    value={templateId || undefined}
                    onValueChange={handleTemplateSelect}
                    disabled={viewMode || loadingTemplate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">None</SelectItem>
                      {templates.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                          No approved templates
                        </SelectItem>
                      ) : (
                        templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    WhatsApp campaigns require an approved template to send.
                    Choose <span className="font-medium text-foreground">None</span> to clear
                    selection and draft a message for preview only.
                  </p>
                  {loadingTemplate && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading template content...
                    </p>
                  )}
                  {selectedTemplate && !loadingTemplate && (
                    <p className="text-xs text-muted-foreground">
                      Selected:{" "}
                      <span className="font-medium text-foreground">
                        {selectedTemplate.name}
                      </span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      templateId
                        ? "Edit template message..."
                        : "Select a template, or type a message..."
                    }
                    rows={6}
                    disabled={viewMode || loadingTemplate}
                    className="resize-none min-h-[140px] bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Attachment type</Label>
                  <Select
                    value={attachmentType}
                    onValueChange={(value: "Image" | "Video" | "Document") => {
                      setAttachmentType(value);
                      handleAttachmentChange(null);
                    }}
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select attachment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Image">Image</SelectItem>
                      <SelectItem value="Video">Video</SelectItem>
                      <SelectItem value="Document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Attachment (optional)</Label>
                  <Input
                    type="file"
                    disabled={viewMode}
                    accept={
                      attachmentType === "Image"
                        ? "image/jpeg,image/png,image/webp"
                        : attachmentType === "Video"
                          ? "video/mp4,video/3gpp"
                          : ".pdf,.doc,.docx"
                    }
                    onChange={(e) =>
                      handleAttachmentChange(e.target.files?.[0] || null)
                    }
                    className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {attachmentFile
                      ? attachmentFile.name
                      : `No file chosen · ${attachmentHint}`}
                  </p>
                </div>
              </div>

              <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/broadcasts")}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-24"
                  onClick={handleSave}
                  disabled={saving || (viewMode ? false : !templateId)}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : viewMode ? (
                    "Done"
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>

            {/* WhatsApp preview — stays fixed while form scrolls */}
            <div
              className="rounded-xl border border-slate-200 min-h-[420px] lg:min-h-0 lg:max-h-[calc(100vh-11.5rem)] h-full overflow-hidden flex flex-col"
              style={{
                backgroundColor: "#EFEAE2",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc4' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              <div className="p-5 flex-1 flex items-end justify-end">
                {message.trim() || attachmentPreviewUrl ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white px-3.5 py-2.5 shadow-sm space-y-2">
                    {attachmentPreviewUrl && (
                      <img
                        src={attachmentPreviewUrl}
                        alt="Attachment preview"
                        className="w-full max-h-40 object-cover rounded-lg"
                      />
                    )}
                    {attachmentFile && attachmentType !== "Image" && (
                      <p className="text-xs text-slate-500 truncate">
                        📎 {attachmentFile.name}
                      </p>
                    )}
                    {message.trim() ? (
                      <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                        {previewText}
                      </p>
                    ) : null}
                    <p className="text-[10px] text-slate-400 text-right">
                      {previewTime}
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-sm text-slate-500 bg-white/80 rounded-lg px-3 py-2 shadow-sm">
                      Select a template to preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
