import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/dashboard/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/utils/authStorage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  FileImage,
  FileText,
  Hash,
  Image as ImageIcon,
  Info,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Unplug,
  Upload,
  Video,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const AUTOSAVE_KEY = "template-create-draft-v2";

type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";
type TemplateButtonType = "QUICK_REPLY" | "URL" | "CALL";
type HeaderType = "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";
type TemplateButton = {
  type: TemplateButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
};
type VariableMap = Record<string, string>;
type LocationDetails = {
  placeName: string;
  address: string;
  latitude: string;
  longitude: string;
};

type CreateTemplateForm = {
  name: string;
  category: TemplateCategory;
  body: string;
  language: string;
  headerType: HeaderType;
  headerText: string;
  footerText: string;
  buttons: TemplateButton[];
};

type SavedDraft = {
  template: CreateTemplateForm;
  variableSamples: VariableMap;
  locationDetails: LocationDetails;
};

const defaultNewTemplate: CreateTemplateForm = {
  name: "",
  category: "MARKETING",
  body: "",
  language: "en_US",
  headerType: "NONE",
  headerText: "",
  footerText: "",
  buttons: [],
};

const defaultLocationDetails: LocationDetails = {
  placeName: "",
  address: "",
  latitude: "",
  longitude: "",
};

const categoryOptions = [
  { value: "MARKETING", label: "Marketing" },
  { value: "UTILITY", label: "Utility" },
  { value: "AUTHENTICATION", label: "Authentication" },
] as const;

const languageOptions = [
  { value: "en_US", label: "English (US)" },
  { value: "en_GB", label: "English (UK)" },
  { value: "hi", label: "Hindi" },
];

const headerOptions: Array<{ value: HeaderType; label: string }> = [
  { value: "NONE", label: "No Header" },
  { value: "TEXT", label: "Text Header" },
  { value: "IMAGE", label: "Image Header" },
  { value: "VIDEO", label: "Video Header" },
  { value: "DOCUMENT", label: "Document Header" },
  { value: "LOCATION", label: "Location Header" },
];

const buttonTypeOptions = [
  { value: "QUICK_REPLY", label: "Quick Reply" },
  { value: "URL", label: "Website URL" },
  { value: "CALL", label: "Call Button" },
] as const;

const variableSuggestions = ["{{1}}", "{{2}}", "{{3}}", "{{4}}"];
const formatLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
const createEmptyButton = (): TemplateButton => ({
  type: "QUICK_REPLY",
  text: "",
});
const normalizeTemplateName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_ ]/g, "")
    .replace(/\s+/g, "_");
const mediaAcceptMap: Record<
  Extract<HeaderType, "IMAGE" | "VIDEO" | "DOCUMENT">,
  string
> = {
  IMAGE: "image/*",
  VIDEO: "video/*",
  DOCUMENT: ".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,application/*,text/*",
};
const headerIconMap = {
  TEXT: FileText,
  IMAGE: ImageIcon,
  VIDEO: Video,
  DOCUMENT: FileImage,
  LOCATION: MapPin,
};
const replaceVariables = (text: string, sampleValues: VariableMap) =>
  text.replace(/\{\{\d+\}\}/g, (token) => sampleValues[token] || token);
const fileSizeLabel = (size: number) => {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

export default function TemplateCreate() {
  const location = useLocation();
  const editingTemplate = location.state?.template || null;
  const isEditMode = !!editingTemplate;

  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [waConnected, setWaConnected] = useState(false);
  const [waChecking, setWaChecking] = useState(true);
  const [newTemplate, setNewTemplate] =
    useState<CreateTemplateForm>(defaultNewTemplate);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [headerFilePreviewUrl, setHeaderFilePreviewUrl] = useState<string>("");
  const [variableSamples, setVariableSamples] = useState<VariableMap>({});
  const [locationDetails, setLocationDetails] = useState<LocationDetails>(
    defaultLocationDetails,
  );

  const isMediaHeader = ["IMAGE", "VIDEO", "DOCUMENT"].includes(
    newTemplate.headerType,
  );
  const bodyVariables = useMemo(
    () => Array.from(new Set(newTemplate.body.match(/\{\{\d+\}\}/g) || [])),
    [newTemplate.body],
  );
  const headerVariables = useMemo(
    () =>
      Array.from(new Set(newTemplate.headerText.match(/\{\{\d+\}\}/g) || [])),
    [newTemplate.headerText],
  );
  const allVariables = useMemo(
    () => Array.from(new Set([...headerVariables, ...bodyVariables])).sort(),
    [bodyVariables, headerVariables],
  );
  const variableCount = allVariables.length;
  const normalizedName = normalizeTemplateName(newTemplate.name);
  const previewButtons = newTemplate.buttons;
  const previewHeaderText =
    newTemplate.headerType === "TEXT"
      ? replaceVariables(newTemplate.headerText.trim(), variableSamples)
      : "";
  const previewFooter = newTemplate.footerText.trim();
  const previewContent = replaceVariables(
    newTemplate.body.trim() || "Your message preview will appear here.",
    variableSamples,
  );
  const HeaderPreviewIcon =
    newTemplate.headerType !== "NONE" && newTemplate.headerType !== "TEXT"
      ? headerIconMap[newTemplate.headerType as keyof typeof headerIconMap]
      : null;

  useEffect(() => {
    if (isEditMode) return; // ❗ IMPORTANT

    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.template) {
        setNewTemplate({ ...defaultNewTemplate, ...parsed.template });
        setVariableSamples(parsed.variableSamples || {});
        setLocationDetails({
          ...defaultLocationDetails,
          ...(parsed.locationDetails || {}),
        });
        setLastSavedAt("Restored from autosave");
      }
    } catch {}
  }, [isEditMode]);

  useEffect(() => {
    const payload: SavedDraft = {
      template: newTemplate,
      variableSamples,
      locationDetails,
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
    setLastSavedAt(
      `Autosaved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    );
  }, [locationDetails, newTemplate, variableSamples]);

  useEffect(() => {
    if (!headerFile || !isMediaHeader) {
      setHeaderFilePreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(headerFile);
    setHeaderFilePreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [headerFile, isMediaHeader]);

  useEffect(() => {
    setVariableSamples((current) => {
      const next: VariableMap = {};
      allVariables.forEach((token, index) => {
        next[token] = current[token] || `Sample ${index + 1}`;
      });
      return next;
    });
  }, [allVariables]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const hasMeaningfulContent =
      !!newTemplate.name.trim() ||
      !!newTemplate.body.trim() ||
      !!newTemplate.headerText.trim() ||
      !!newTemplate.footerText.trim() ||
      newTemplate.buttons.length > 0 ||
      !!headerFile;
    setIsDirty(hasMeaningfulContent);
  }, [headerFile, newTemplate]);

  const templateType = useMemo(() => {
    if (newTemplate.headerType !== "NONE" || newTemplate.buttons.length > 0)
      return "Interactive";
    if (/\{\{.+\}\}/.test(newTemplate.body)) return "Variable Text";
    return "Text";
  }, [newTemplate]);

  const readinessChecks = useMemo(
    () => [
      { label: "Template name added", done: normalizedName.length >= 3 },
      {
        label: "Message body added",
        done: newTemplate.body.trim().length >= 5,
      },
      {
        label: "Header valid",
        done:
          newTemplate.headerType === "NONE" ||
          (newTemplate.headerType === "LOCATION"
            ? !!locationDetails.placeName.trim() &&
              !!locationDetails.address.trim()
            : newTemplate.headerType === "TEXT"
              ? newTemplate.headerText.trim().length > 0
              : !!headerFile),
      },
      {
        label: "Buttons valid",
        done: newTemplate.buttons.every(
          (button) =>
            button.text.trim() &&
            (button.type !== "URL" || button.url?.trim()) &&
            (button.type !== "CALL" || button.phoneNumber?.trim()),
        ),
      },
      {
        label: "Sample values ready",
        done: allVariables.every(
          (token) => (variableSamples[token] || "").trim().length > 0,
        ),
      },
    ],
    [
      allVariables,
      headerFile,
      locationDetails.address,
      locationDetails.placeName,
      newTemplate,
      normalizedName,
      variableSamples,
    ],
  );

  const completeChecks = readinessChecks.filter((item) => item.done).length;

  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (normalizedName.length < 3)
      issues.push(
        "Template name should be at least 3 valid characters after normalization.",
      );
    if (newTemplate.body.trim().length < 5)
      issues.push("Body content should be more descriptive before submission.");
    if (newTemplate.footerText.length > 60)
      issues.push(
        "Footer should stay under 60 characters for better approval chances.",
      );
    if (newTemplate.headerType === "TEXT" && newTemplate.headerText.length > 60)
      issues.push("Text header should stay under 60 characters.");
    if (newTemplate.body.length > 1024)
      issues.push(
        "Body is quite long. Consider shortening it for better readability.",
      );
    if (
      newTemplate.category === "AUTHENTICATION" &&
      newTemplate.buttons.length > 0
    )
      issues.push("Authentication templates cannot include buttons.");
    if (
      newTemplate.buttons.length > 1 &&
      newTemplate.buttons.some((button) => button.type === "URL") &&
      newTemplate.buttons.some((button) => button.type === "CALL")
    ) {
      issues.push(
        "Mixed call and URL actions are harder to scan. Prefer one clear primary CTA.",
      );
    }
    if (allVariables.some((token, index) => token !== `{{${index + 1}}}`))
      issues.push("Variables should be sequential like {{1}}, {{2}}, {{3}}.");
    if (isMediaHeader && !headerFile)
      issues.push(
        `Upload a ${newTemplate.headerType.toLowerCase()} file to complete the media header.`,
      );
    if (
      newTemplate.headerType === "LOCATION" &&
      (!locationDetails.placeName.trim() || !locationDetails.address.trim())
    ) {
      issues.push(
        "Location headers should include at least a place name and address for preview quality.",
      );
    }
    newTemplate.buttons.forEach((button, index) => {
      if (!button.text.trim())
        issues.push(`Button ${index + 1} is missing label text.`);
      if (
        button.type === "URL" &&
        button.url &&
        !/^https?:\/\//i.test(button.url)
      )
        issues.push(
          `Button ${index + 1} URL should start with http:// or https://.`,
        );
      if (
        button.type === "CALL" &&
        button.phoneNumber &&
        !/^\+?[0-9\-\s]{7,20}$/.test(button.phoneNumber)
      )
        issues.push(`Button ${index + 1} phone number format looks invalid.`);
    });
    return issues;
  }, [
    allVariables,
    headerFile,
    isMediaHeader,
    locationDetails.address,
    locationDetails.placeName,
    newTemplate,
    normalizedName,
  ]);

  const insertVariable = (token: string, target: "body" | "header") => {
    if (target === "body") {
      setNewTemplate((current) => ({
        ...current,
        body: `${current.body}${current.body ? " " : ""}${token}`,
      }));
      return;
    }
    setNewTemplate((current) => ({
      ...current,
      headerType: "TEXT",
      headerText: `${current.headerText}${current.headerText ? " " : ""}${token}`,
    }));
  };

  const addButton = () => {
    if (newTemplate.buttons.length >= 3) return;
    setNewTemplate((current) => ({
      ...current,
      buttons: [...current.buttons, createEmptyButton()],
    }));
  };

  const updateButton = (index: number, updates: Partial<TemplateButton>) => {
    setNewTemplate((current) => ({
      ...current,
      buttons: current.buttons.map((button, buttonIndex) => {
        if (buttonIndex !== index) return button;
        const nextButton = { ...button, ...updates };
        if (updates.type === "QUICK_REPLY") {
          delete nextButton.url;
          delete nextButton.phoneNumber;
        }
        if (updates.type === "URL") {
          delete nextButton.phoneNumber;
          nextButton.url = nextButton.url || "";
        }
        if (updates.type === "CALL") {
          delete nextButton.url;
          nextButton.phoneNumber = nextButton.phoneNumber || "";
        }
        return nextButton;
      }),
    }));
  };

  const removeButton = (index: number) => {
    setNewTemplate((current) => ({
      ...current,
      buttons: current.buttons.filter(
        (_, buttonIndex) => buttonIndex !== index,
      ),
    }));
  };

  // const duplicateCurrentTemplate = () => {
  //   setNewTemplate((current) => ({
  //     ...current,
  //     name: current.name ? `${current.name} Copy` : "template_copy",
  //   }));
  //   setHeaderFile(null);
  //   toast({
  //     title: "Template duplicated",
  //     description: "A copy of your current builder state is ready to edit.",
  //   });
  // };

  const clearDraft = () => {
    setNewTemplate(defaultNewTemplate);
    setHeaderFile(null);
    setVariableSamples({});
    setLocationDetails(defaultLocationDetails);
    localStorage.removeItem(AUTOSAVE_KEY);
    setLastSavedAt("Draft cleared");
    setIsDirty(false);
    toast({
      title: "Draft cleared",
      description: "Builder reset to a clean template.",
    });
  };

  const validateForSubmit = () => {
    if (validationIssues.length > 0) {
      toast({
        title: "Fix a few details first",
        description: validationIssues[0],
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleLeave = async () => {
    if (!isDirty) {
      navigate("/templates");
      return;
    }

    const result = await Swal.fire({
      title: "Discard changes?",
      text: "You have unsaved changes in this template.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Leave page",
      cancelButtonText: "Stay here",
      reverseButtons: true,
      confirmButtonColor: "#16a34a",
    });

    if (result.isConfirmed) {
      navigate("/templates");
    }
  };

  const handleCreate = async () => {
    if (!validateForSubmit()) return;

    try {
      setIsCreating(true);
      const formData = new FormData();
      if (isEditMode) {
        formData.append("templateId", editingTemplate.id);
      }
      formData.append("name", newTemplate.name.trim());
      formData.append("category", newTemplate.category);
      formData.append("language", newTemplate.language);
      formData.append("body", newTemplate.body.trim());

      if (newTemplate.headerType !== "NONE") {
        const headerPayload =
          newTemplate.headerType === "TEXT"
            ? { type: "TEXT", text: newTemplate.headerText.trim() }
            : newTemplate.headerType === "LOCATION"
              ? { type: "LOCATION", locationDetails }
              : { type: newTemplate.headerType };
        formData.append("header", JSON.stringify(headerPayload));
      }
      if (newTemplate.footerText.trim())
        formData.append(
          "footer",
          JSON.stringify({ text: newTemplate.footerText.trim() }),
        );
      if (newTemplate.buttons.length > 0) {
        formData.append(
          "buttons",
          JSON.stringify(
            newTemplate.buttons.map((button) => ({
              type: button.type,
              text: button.text.trim(),
              ...(button.type === "URL" ? { url: button.url?.trim() } : {}),
              ...(button.type === "CALL"
                ? { phoneNumber: button.phoneNumber?.trim() }
                : {}),
            })),
          ),
        );
      }
      formData.append("variableSamples", JSON.stringify(variableSamples));
      formData.append("locationDetails", JSON.stringify(locationDetails));
      if (headerFile) formData.append("file", headerFile);

      const token = getAuthToken();
      const url = isEditMode
        ? `${API_BASE}/user/whatsapp/template/update`
        : `${API_BASE}/user/whatsapp/template/create`;

      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || json.status !== 1)
        throw new Error(json.message || "Failed to create template");

      localStorage.removeItem(AUTOSAVE_KEY);
      setIsDirty(false);
      toast({
        title: "Template created",
        description: json.message || "Template has been saved successfully.",
      });
      navigate("/templates");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create template",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const mediaPreview = useMemo(() => {
    if (!isMediaHeader) return null;
    if (!headerFile) {
      return (
        <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          Upload a file to see a live {newTemplate.headerType.toLowerCase()}{" "}
          preview here.
        </div>
      );
    }

    if (newTemplate.headerType === "IMAGE") {
      return (
        <div className="overflow-hidden rounded-xl border bg-muted/20">
          <img
            src={headerFilePreviewUrl}
            alt={headerFile.name}
            className="h-52 w-full object-cover"
          />
        </div>
      );
    }

    if (newTemplate.headerType === "VIDEO") {
      return (
        <div className="overflow-hidden rounded-xl border bg-black">
          <video
            src={headerFilePreviewUrl}
            controls
            className="h-52 w-full object-cover"
          />
        </div>
      );
    }

    return (
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-background p-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">{headerFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {fileSizeLabel(headerFile.size)}
            </p>
            <Badge variant="outline">Document Preview</Badge>
          </div>
        </div>
      </div>
    );
  }, [headerFile, headerFilePreviewUrl, isMediaHeader, newTemplate.headerType]);

  useEffect(() => {
    if (!editingTemplate) return;

    if (editingTemplate?.status === "approved") {
      toast({
        title: "Not allowed",
        description: "Approved templates cannot be edited",
        variant: "destructive",
      });
      navigate("/templates");
      return;
    }

    setNewTemplate({
      name: editingTemplate.name,
      category: editingTemplate.category,
      body: editingTemplate.content,
      language: editingTemplate.language,
      headerType: editingTemplate.headerText ? "TEXT" : "NONE",
      headerText: editingTemplate.headerText || "",
      footerText: editingTemplate.footerText || "",
      buttons: editingTemplate.buttons || [],
    });
  }, [editingTemplate, navigate, toast]);

  useEffect(() => {
    let cancelled = false;
    const loadWhatsApp = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(
          `${API_BASE}/user/account/whatsapp-integration`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        const accounts = json?.data?.accounts || [];
        const active = accounts.find(
          (a: { isActive?: boolean; status?: string }) =>
            a.isActive && a.status === "ACTIVE",
        );
        if (!cancelled) setWaConnected(Boolean(active));
      } catch {
        if (!cancelled) setWaConnected(false);
      } finally {
        if (!cancelled) setWaChecking(false);
      }
    };
    loadWhatsApp();
    return () => {
      cancelled = true;
    };
  }, []);

  if (waChecking) {
    return (
      <div className="p-10 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!waConnected && !isEditMode) {
    return (
      <div className="flex flex-col h-full min-h-0 w-full">
        <Header title="New Template" subtitle="Create Template for Review" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">New Template</h1>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Create Template for Review
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-slate-200"
                  onClick={() => navigate("/templates")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button disabled className="bg-slate-200 text-slate-500">
                  Create Template
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white min-h-[420px] flex items-center justify-center px-6 py-16">
              <div className="max-w-md text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <Unplug className="h-7 w-7 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    WhatsApp Cloud API required
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    Add a WhatsApp Cloud API connection in Settings before you
                    can create a template.
                  </p>
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => navigate("/settings?tab=whatsapp")}
                >
                  Connect WhatsApp account
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const previewTime = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header
        title={isEditMode ? "Edit Template" : "New Template"}
        subtitle="Create Template for Review"
      />
      <main className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col">
        <div className="max-w-6xl mx-auto w-full flex-1 min-h-0 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isEditMode ? "Edit Template" : "New Template"}
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Create Template for Review
                {lastSavedAt ? (
                  <span className="text-slate-400">· {lastSavedAt}</span>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-slate-200"
                onClick={handleLeave}
                disabled={isCreating}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-36"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : isEditMode ? (
                  "Update Template"
                ) : (
                  "Create Template"
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-5 flex-1 min-h-0 items-stretch">
            <div className="flex flex-col min-h-0 h-full max-h-[calc(100vh-11.5rem)] rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="campaign-form-scroll flex-1 min-h-0 overflow-y-scroll overscroll-contain p-5 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Basics</p>
                    <p className="text-xs text-slate-500">
                      Name, category, and language for Meta review.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearDraft}
                    disabled={isEditMode}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-name">Template name</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, name: e.target.value })
                    }
                    placeholder="e.g., Order Delivery Update"
                  />
                  <p className="text-xs text-slate-500">
                    Meta-safe name:{" "}
                    <span className="font-medium text-slate-800">
                      {normalizedName || "template_name_preview"}
                    </span>
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={(value) =>
                        setNewTemplate((current) => ({
                          ...current,
                          category: value as TemplateCategory,
                          buttons:
                            value === "AUTHENTICATION" ? [] : current.buttons,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={newTemplate.language}
                      onValueChange={(value) =>
                        setNewTemplate({ ...newTemplate, language: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((language) => (
                          <SelectItem
                            key={language.value}
                            value={language.value}
                          >
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Message structure
                    </p>
                    <p className="text-xs text-slate-500">
                      Header, body, footer, and variables.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Header</Label>
                    <Select
                      value={newTemplate.headerType}
                      onValueChange={(value) => {
                        const nextValue = value as HeaderType;
                        setNewTemplate({
                          ...newTemplate,
                          headerType: nextValue,
                          headerText:
                            nextValue === "TEXT" ? newTemplate.headerText : "",
                        });
                        if (!["IMAGE", "VIDEO", "DOCUMENT"].includes(nextValue))
                          setHeaderFile(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {headerOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newTemplate.headerType === "TEXT" && (
                    <div className="space-y-2">
                      <Label htmlFor="template-header">Header text</Label>
                      <Input
                        id="template-header"
                        value={newTemplate.headerText}
                        onChange={(e) =>
                          setNewTemplate({
                            ...newTemplate,
                            headerText: e.target.value,
                          })
                        }
                        placeholder="Important update"
                      />
                    </div>
                  )}

                  {isMediaHeader && (
                    <div className="space-y-3">
                      <Label htmlFor="template-media-file">
                        Upload {formatLabel(newTemplate.headerType)} file
                      </Label>
                      <Input
                        id="template-media-file"
                        type="file"
                        accept={
                          mediaAcceptMap[
                            newTemplate.headerType as keyof typeof mediaAcceptMap
                          ]
                        }
                        className="hidden"
                        onChange={(e) =>
                          setHeaderFile(e.target.files?.[0] || null)
                        }
                      />
                      <label
                        htmlFor="template-media-file"
                        className="block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Upload className="h-4 w-4 text-primary" />
                            {headerFile
                              ? headerFile.name
                              : `Choose ${formatLabel(newTemplate.headerType).toLowerCase()} file`}
                          </div>
                          <span className="text-xs font-medium text-slate-600">
                            {headerFile ? "Change" : "Browse"}
                          </span>
                        </div>
                      </label>
                      {headerFile && (
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                          <span className="text-slate-600">
                            {fileSizeLabel(headerFile.size)}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setHeaderFile(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                      {mediaPreview}
                    </div>
                  )}

                  {newTemplate.headerType === "LOCATION" && (
                    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="location-name">Place name</Label>
                        <Input
                          id="location-name"
                          value={locationDetails.placeName}
                          onChange={(e) =>
                            setLocationDetails((current) => ({
                              ...current,
                              placeName: e.target.value,
                            }))
                          }
                          placeholder="Main Store"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location-address">Address</Label>
                        <Input
                          id="location-address"
                          value={locationDetails.address}
                          onChange={(e) =>
                            setLocationDetails((current) => ({
                              ...current,
                              address: e.target.value,
                            }))
                          }
                          placeholder="MG Road, Bengaluru"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location-latitude">Latitude</Label>
                        <Input
                          id="location-latitude"
                          value={locationDetails.latitude}
                          onChange={(e) =>
                            setLocationDetails((current) => ({
                              ...current,
                              latitude: e.target.value,
                            }))
                          }
                          placeholder="12.9716"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location-longitude">Longitude</Label>
                        <Input
                          id="location-longitude"
                          value={locationDetails.longitude}
                          onChange={(e) =>
                            setLocationDetails((current) => ({
                              ...current,
                              longitude: e.target.value,
                            }))
                          }
                          placeholder="77.5946"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="template-body">Message content</Label>
                    <Textarea
                      id="template-body"
                      value={newTemplate.body}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, body: e.target.value })
                      }
                      placeholder="Use {{1}}, {{2}} for dynamic variables..."
                      rows={7}
                      className="resize-none bg-slate-50"
                    />
                    <div className="flex flex-wrap gap-2">
                      {variableSuggestions.map((token) => (
                        <Button
                          key={token}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(token, "body")}
                        >
                          <Hash className="mr-1 h-3.5 w-3.5" />
                          {token}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-footer">Footer text</Label>
                    <Input
                      id="template-footer"
                      value={newTemplate.footerText}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          footerText: e.target.value,
                        })
                      }
                      placeholder="Optional footer"
                    />
                  </div>
                </div>

                {allVariables.length > 0 && (
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Sample values
                      </p>
                      <p className="text-xs text-slate-500">
                        Used only for live preview.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {allVariables.map((token) => (
                        <div key={token} className="space-y-2">
                          <Label htmlFor={`sample-${token}`}>{token}</Label>
                          <Input
                            id={`sample-${token}`}
                            value={variableSamples[token] || ""}
                            onChange={(e) =>
                              setVariableSamples((current) => ({
                                ...current,
                                [token]: e.target.value,
                              }))
                            }
                            placeholder={`Example for ${token}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Action buttons
                      </p>
                      <p className="text-xs text-slate-500">
                        Up to 3 buttons. Not allowed for Authentication.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addButton}
                      disabled={
                        newTemplate.buttons.length >= 3 ||
                        newTemplate.category === "AUTHENTICATION"
                      }
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  {newTemplate.category === "AUTHENTICATION" && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Buttons are disabled for Authentication templates.
                    </div>
                  )}

                  {newTemplate.buttons.length === 0 &&
                    newTemplate.category !== "AUTHENTICATION" && (
                      <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                        Optional: add quick replies, website, or call buttons.
                      </div>
                    )}

                  {newTemplate.buttons.map((button, index) => (
                    <div
                      key={index}
                      className="space-y-3 rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800">
                          Button {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeButton(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={button.type}
                            onValueChange={(value) =>
                              updateButton(index, {
                                type: value as TemplateButtonType,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {buttonTypeOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Label</Label>
                          <Input
                            value={button.text}
                            onChange={(e) =>
                              updateButton(index, { text: e.target.value })
                            }
                            placeholder="e.g., Track Order"
                          />
                        </div>
                      </div>
                      {button.type === "URL" && (
                        <div className="space-y-2">
                          <Label>Website URL</Label>
                          <Input
                            value={button.url || ""}
                            onChange={(e) =>
                              updateButton(index, { url: e.target.value })
                            }
                            placeholder="https://example.com"
                          />
                        </div>
                      )}
                      {button.type === "CALL" && (
                        <div className="space-y-2">
                          <Label>Phone number</Label>
                          <Input
                            value={button.phoneNumber || ""}
                            onChange={(e) =>
                              updateButton(index, {
                                phoneNumber: e.target.value,
                              })
                            }
                            placeholder="+911234567890"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {validationIssues.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5">
                    <p className="text-sm font-medium text-amber-900">
                      Fix before create
                    </p>
                    {validationIssues.slice(0, 3).map((issue) => (
                      <p key={issue} className="text-xs text-amber-800">
                        · {issue}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleLeave}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast({
                      title: "Draft saved",
                      description:
                        "Your draft is already autosaved locally in this browser.",
                    })
                  }
                  disabled={isCreating}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-32"
                  onClick={handleCreate}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : isEditMode ? (
                    "Update"
                  ) : (
                    "Create Template"
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-col min-h-0 h-full max-h-[calc(100vh-11.5rem)] gap-4">
              <div
                className="rounded-xl border border-slate-200 flex-1 min-h-[320px] overflow-hidden flex flex-col"
                style={{
                  backgroundColor: "#EFEAE2",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc4' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
                <div className="p-5 flex-1 flex items-end justify-end">
                  <div className="max-w-[88%] rounded-2xl rounded-br-md bg-white px-3.5 py-2.5 shadow-sm space-y-2">
                    {previewHeaderText ? (
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {previewHeaderText}
                      </p>
                    ) : null}

                    {newTemplate.headerType === "LOCATION" && (
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {locationDetails.placeName || "Location"}
                        </div>
                        <p className="mt-1">
                          {locationDetails.address || "Address preview"}
                        </p>
                      </div>
                    )}

                    {isMediaHeader && !headerFile && (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500 flex items-center gap-2">
                        {HeaderPreviewIcon ? (
                          <HeaderPreviewIcon className="h-3.5 w-3.5 text-primary" />
                        ) : null}
                        {formatLabel(newTemplate.headerType)} header
                      </div>
                    )}

                    {isMediaHeader && headerFile ? (
                      <div className="overflow-hidden rounded-lg">{mediaPreview}</div>
                    ) : null}

                    <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                      {previewContent}
                    </p>

                    {previewFooter ? (
                      <p className="text-[11px] text-slate-400">{previewFooter}</p>
                    ) : null}

                    {previewButtons.length > 0 && (
                      <div className="space-y-1.5 border-t border-slate-100 pt-2">
                        {previewButtons.map((button, index) => (
                          <div
                            key={index}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-sky-700"
                          >
                            {button.type === "URL" && (
                              <Link2 className="h-3.5 w-3.5" />
                            )}
                            {button.type === "CALL" && (
                              <Phone className="h-3.5 w-3.5" />
                            )}
                            {button.type === "QUICK_REPLY" && (
                              <MessageCircle className="h-3.5 w-3.5" />
                            )}
                            {button.text || formatLabel(button.type)}
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 text-right">
                      {previewTime}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    Approval checklist
                  </p>
                  <span
                    className={`text-xs font-medium ${
                      completeChecks === readinessChecks.length
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {completeChecks}/{readinessChecks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {readinessChecks.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600">{item.label}</span>
                      {item.done ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[11px] text-slate-500">Type</p>
                    <p className="text-sm font-medium text-slate-800">
                      {templateType}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[11px] text-slate-500">Buttons</p>
                    <p className="text-sm font-medium text-slate-800">
                      {previewButtons.length}/3
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

