import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/utils/authStorage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  FileImage,
  FileText,
  Hash,
  Image as ImageIcon,
  Info,
  LayoutTemplate,
  Link2,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Sparkles,
  Upload,
  Video,
  Wand2,
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

const templatePresets = [
  {
    title: "Welcome Flow",
    description: "Onboarding, offers, or first-touch campaigns.",
    category: "MARKETING" as TemplateCategory,
    body: "Hi {{1}}, welcome to {{2}}. We are excited to have you here.",
    footerText: "Reply STOP to opt out",
    buttons: [
      { type: "QUICK_REPLY" as TemplateButtonType, text: "Get Started" },
    ],
  },
  {
    title: "Order Update",
    description: "Shipping, invoice, and order status alerts.",
    category: "UTILITY" as TemplateCategory,
    body: "Hi {{1}}, your order #{{2}} is now {{3}}.",
    footerText: "Need help? Contact support",
    buttons: [
      {
        type: "URL" as TemplateButtonType,
        text: "Track Order",
        url: "https://example.com/track",
      },
    ],
  },
  {
    title: "Store Visit",
    description: "Send a location-focused store or branch update.",
    category: "UTILITY" as TemplateCategory,
    body: "Hi {{1}}, visit our nearest branch today for support or pickup.",
    footerText: "Open till 8 PM",
    buttons: [],
    headerType: "LOCATION" as HeaderType,
  },
  {
    title: "OTP / Verification",
    description: "Secure authentication or verification flow.",
    category: "AUTHENTICATION" as TemplateCategory,
    body: "Your verification code is {{1}}. This code expires in {{2}} minutes.",
    footerText: "Do not share this code with anyone",
    buttons: [],
  },
];

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
  const [isQuickStartModalOpen, setIsQuickStartModalOpen] = useState(false);
  const [selectedPresetTitle, setSelectedPresetTitle] = useState<string | null>(
    null,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
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
  const healthTone =
    completeChecks === readinessChecks.length
      ? "text-green-600"
      : "text-amber-600";

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

  const guidanceTips = useMemo(() => {
    const tips: string[] = [];
    if (
      newTemplate.category === "MARKETING" &&
      newTemplate.buttons.length === 0
    )
      tips.push(
        "Marketing templates usually perform better with at least one CTA button.",
      );
    if (newTemplate.category === "UTILITY" && !newTemplate.footerText.trim())
      tips.push("Utility updates often benefit from a short support footer.");
    if (
      newTemplate.category === "AUTHENTICATION" &&
      !/code|otp|verification/i.test(newTemplate.body)
    )
      tips.push(
        "Authentication copy should clearly mention code or verification intent.",
      );
    if (allVariables.length > 3)
      tips.push(
        "Too many variables can slow template approval and confuse mapping teams.",
      );
    if (!newTemplate.body.trim().match(/[.!?]$/))
      tips.push("Ending the message cleanly improves readability in preview.");
    if (newTemplate.headerType === "NONE" && newTemplate.buttons.length === 0)
      tips.push(
        "A text-only template is fine, but richer templates often get better engagement.",
      );
    return tips;
  }, [allVariables.length, newTemplate]);

  const isPresetActive = (preset: (typeof templatePresets)[number]) =>
    newTemplate.category === preset.category &&
    newTemplate.body === preset.body &&
    newTemplate.footerText === preset.footerText &&
    newTemplate.headerType === (preset.headerType || "NONE") &&
    JSON.stringify(newTemplate.buttons) === JSON.stringify(preset.buttons);

  const openQuickStartModal = () => {
    const activePreset = templatePresets.find((preset) =>
      isPresetActive(preset),
    );
    setSelectedPresetTitle(
      activePreset?.title || templatePresets[0]?.title || null,
    );
    setIsQuickStartModalOpen(true);
  };

  const applyPreset = (preset: (typeof templatePresets)[number]) => {
    setNewTemplate((current) => ({
      ...current,
      category: preset.category,
      body: preset.body,
      footerText: preset.footerText,
      buttons: preset.buttons,
      headerType: preset.headerType || "NONE",
      headerText: "",
    }));
    setHeaderFile(null);
    if (preset.headerType === "LOCATION") {
      setLocationDetails({
        placeName: "Main Branch",
        address: "MG Road, Bengaluru",
        latitude: "12.9716",
        longitude: "77.5946",
      });
    } else {
      setLocationDetails(defaultLocationDetails);
    }
    setIsQuickStartModalOpen(false);
  };

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
    }, [editingTemplate]);

    useEffect(() => {
      if (!isEditMode) {
        setNewTemplate(defaultNewTemplate);
        setHeaderFile(null);
        setVariableSamples({});
        setLocationDetails(defaultLocationDetails);
      }
    }, [isEditMode]);

    useEffect(() => {
      if (!editingTemplate) {
        setNewTemplate(defaultNewTemplate);
        setHeaderFile(null);
        setVariableSamples({});
        setLocationDetails(defaultLocationDetails);
      }
    }, [editingTemplate]);

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

    // Prevent editing approved template
    if (editingTemplate?.status === "approved") {
      toast({
        title: "Not allowed",
        description: "Approved templates cannot be edited",
        variant: "destructive",
      });
      navigate("/templates");
      return;
    }

    // Prefill form
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
  }, [editingTemplate]);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header />
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-fit px-0"
                onClick={handleLeave}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back To Templates
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {isEditMode ? "Edit Template" : "Create Template"}
                </h1>
                <p className="text-muted-foreground">
                  Dedicated full-page builder for rich WhatsApp templates with
                  validation, previews, and autosave.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3">
                <Sparkles className="h-4 w-4 text-primary" />
                Text, media, document, location, and CTA-ready templates.
              </div>
              <div className="rounded-xl border bg-background px-4 py-3">
                {lastSavedAt || "Autosave ready"}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-5">
              {/* <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <LayoutTemplate className="h-5 w-5 text-primary" />
                        Quick Starts
                      </CardTitle>
                      <CardDescription>
                        Open a focused modal to start from a polished preset
                        instead of building from scratch.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                        {templatePresets.length} ready-to-use starting points
                      </div>
                      <Button
                        type="button"
                        onClick={() => setIsQuickStartModalOpen(true)}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Open Quick Starts
                        </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-2xl border border-dashed bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Preset-powered setup
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Choose a quick-start preset in the modal, then
                          fine-tune the body, header, buttons, and samples here.
                        </p>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        Recommended for faster setup
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card> */}

              {/* <Modal
                open={isQuickStartModalOpen}
                onOpenChange={setIsQuickStartModalOpen}
                title="Quick Start Presets"
                description="Pick a polished starting point and continue customizing it in the builder."
                size="2xl"
                contentClassName="max-h-[88vh] overflow-hidden p-0 sm:max-w-5xl p-2"
              >
                <div className="flex max-h-[88vh] flex-col">
                  <div className="overflow-y-auto px-6 pb-6 pt-2">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {templatePresets.map((preset, index) => {
                      const isActive = isPresetActive(preset);
                      const isSelected = selectedPresetTitle === preset.title;
                      const presetHeader = preset.headerType
                        ? formatLabel(preset.headerType)
                        : "Text Only";
                      return (
                        <div
                          key={preset.title}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedPresetTitle(preset.title)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedPresetTitle(preset.title);
                            }
                          }}
                          className={`group rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${isSelected ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-semibold text-foreground">
                                  {preset.title}
                                </p>
                                {index === 0 && (
                                  <Badge variant="secondary">Popular</Badge>
                                )}
                                {isActive && (
                                  <Badge className="bg-primary text-primary-foreground">
                                    Applied
                                  </Badge>
                                )}
                                {isSelected && !isActive && (
                                  <Badge variant="outline">Selected</Badge>
                                )}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {preset.description}
                              </p>
                            </div>
                            <div
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                            >
                              {formatLabel(preset.category)}
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                            <div className="rounded-xl border bg-muted/20 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Header
                              </p>
                              <p className="mt-1 font-medium text-foreground">
                                {presetHeader}
                              </p>
                            </div>
                            <div className="rounded-xl border bg-muted/20 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Buttons
                              </p>
                              <p className="mt-1 font-medium text-foreground">
                                {preset.buttons.length}
                              </p>
                            </div>
                            <div className="rounded-xl border bg-muted/20 px-3 py-2">
                              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Footer
                              </p>
                              <p className="mt-1 font-medium text-foreground">
                                {preset.footerText ? "Included" : "None"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm">
                            <span className="text-muted-foreground">
                              {isActive
                                ? "This preset is currently active"
                                : isSelected
                                  ? "Template selected. Use the button below to apply it."
                                  : "Select this card, then use the button below to apply it."}
                            </span>
                            <Button
                              type="button"
                              className="w-full"
                              variant={isSelected || isActive ? "default" : "outline"}
                              onClick={(event) => {
                                event.stopPropagation();
                                applyPreset(preset);
                              }}
                            >
                              {isActive ? "Use This Template Again" : "Select Template"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsQuickStartModalOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </Modal> */}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Basics</CardTitle>
                    <CardDescription>
                      Choose the template identity users and Meta will see.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {/* <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={duplicateCurrentTemplate}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </Button> */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearDraft}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear Draft
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, name: e.target.value })
                      }
                      placeholder="e.g., Order Delivery Update"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Meta-safe name preview:{" "}
                      <span className="font-medium text-foreground">
                        {normalizedName || "template_name_preview"}
                      </span>
                    </p>
                  </div>
                  <div>
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
                  <div>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message Structure</CardTitle>
                  <CardDescription>
                    Craft the content exactly how it should appear in WhatsApp.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
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
                    <div>
                      <Label htmlFor="template-header">Header Text</Label>
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
                        Upload {formatLabel(newTemplate.headerType)} File
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
                        className="block cursor-pointer rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 transition-colors hover:border-primary hover:bg-primary/10"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-foreground">
                              <Upload className="h-4 w-4 text-primary" />
                              <p className="font-medium">
                                {headerFile
                                  ? "Replace uploaded file"
                                  : `Choose ${formatLabel(newTemplate.headerType)} file`}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {headerFile
                                ? headerFile.name
                                : `Click to browse and upload a ${newTemplate.headerType.toLowerCase()} header file.`}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline">Max 20MB</Badge>
                              <Badge variant="outline">
                                Live preview enabled
                              </Badge>
                              <Badge variant="outline">
                                Backend compatible
                              </Badge>
                            </div>
                          </div>
                          <div className="rounded-lg border bg-background px-3 py-2 text-sm font-medium text-foreground">
                            {headerFile ? "Change File" : "Browse Files"}
                          </div>
                        </div>
                      </label>
                      {headerFile && (
                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-3 text-sm">
                          <div>
                            <p className="font-medium text-foreground">
                              {headerFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fileSizeLabel(headerFile.size)} selected
                            </p>
                          </div>
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
                    <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="location-name">Place Name</Label>
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
                      <div>
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
                      <div>
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
                      <div>
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
                      <p className="sm:col-span-2 text-xs text-muted-foreground">
                        Location details currently improve preview quality on
                        this page. Backend create API still stores the WhatsApp
                        location header type only.
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="template-body">Message Content</Label>
                    <Textarea
                      id="template-body"
                      value={newTemplate.body}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, body: e.target.value })
                      }
                      placeholder="Use {{1}}, {{2}} for dynamic variables..."
                      rows={8}
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
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
                  <div>
                    <Label htmlFor="template-footer">Footer Text</Label>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    Variable Mapping
                  </CardTitle>
                  <CardDescription>
                    Keep placeholders sequential and easy for your team to map.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {variableSuggestions.map((token) => (
                      <Button
                        key={`header-${token}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariable(token, "header")}
                      >
                        Add To Header {token}
                      </Button>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border p-4">
                      <p className="text-sm font-medium">Body Variables</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {bodyVariables.length > 0 ? (
                          bodyVariables.map((item) => (
                            <Badge key={item} variant="secondary">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No variables detected yet.
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <p className="text-sm font-medium">Header Variables</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {headerVariables.length > 0 ? (
                          headerVariables.map((item) => (
                            <Badge key={item} variant="secondary">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No header variables detected.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          Sample Values
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Preview your template with realistic variable data
                          before creating it.
                        </p>
                      </div>
                      <Badge variant="outline">
                        {allVariables.length} variables
                      </Badge>
                    </div>
                    {allVariables.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                        Add placeholders like {"{{1}}"} and {"{{2}}"} to unlock
                        sample-value mapping.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {allVariables.map((token) => (
                          <div key={token}>
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
                              placeholder={`Example value for ${token}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Action Buttons</CardTitle>
                    <CardDescription>
                      CTAs improve conversions and reduce reply friction.
                    </CardDescription>
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
                    Add Button
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Add up to 3 buttons. Authentication templates do not allow
                    buttons.
                  </p>
                  {newTemplate.category === "AUTHENTICATION" && (
                    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                      Buttons are disabled because the Authentication category
                      is selected.
                    </div>
                  )}
                  {newTemplate.buttons.length === 0 &&
                    newTemplate.category !== "AUTHENTICATION" && (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        Add quick replies, website URLs, or call buttons to make
                        the template more interactive.
                      </div>
                    )}
                  {newTemplate.buttons.map((button, index) => (
                    <div
                      key={index}
                      className="space-y-3 rounded-xl border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Button {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeButton(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Button Type</Label>
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
                        <div>
                          <Label>Button Text</Label>
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
                        <div>
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
                        <div>
                          <Label>Phone Number</Label>
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
                      <div className="rounded-lg bg-muted/20 p-3 text-sm">
                        <p className="font-medium text-foreground">
                          Action preview
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                          {button.type === "URL" && (
                            <Link2 className="h-4 w-4" />
                          )}
                          {button.type === "CALL" && (
                            <Phone className="h-4 w-4" />
                          )}
                          {button.type === "QUICK_REPLY" && (
                            <MessageCircle className="h-4 w-4" />
                          )}
                          <span>
                            {button.type === "URL" &&
                              (button.url?.trim() ||
                                "Destination URL will appear here")}
                            {button.type === "CALL" &&
                              (button.phoneNumber?.trim() ||
                                "Tap-to-call number will appear here")}
                            {button.type === "QUICK_REPLY" &&
                              "User will send a one-tap quick reply"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>
                    See the exact feel before saving the template.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl bg-[#e7f7ef] p-4 dark:bg-green-950/20">
                    <div className="mx-auto max-w-[320px] rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                      {previewHeaderText && (
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {previewHeaderText}
                        </p>
                      )}
                      {newTemplate.headerType === "LOCATION" && (
                        <div className="mb-3 rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <MapPin className="h-4 w-4 text-primary" />{" "}
                            {locationDetails.placeName || "Location Header"}
                          </div>
                          <p className="mt-1">
                            {locationDetails.address ||
                              "Customer will see a location card style header in WhatsApp."}
                          </p>
                          {(locationDetails.latitude ||
                            locationDetails.longitude) && (
                            <p className="mt-2 text-xs">
                              {locationDetails.latitude || "--"},{" "}
                              {locationDetails.longitude || "--"}
                            </p>
                          )}
                        </div>
                      )}
                      {isMediaHeader && !headerFile && (
                        <div className="mb-3 rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            {HeaderPreviewIcon && (
                              <HeaderPreviewIcon className="h-4 w-4 text-primary" />
                            )}
                            {formatLabel(newTemplate.headerType)} Header
                          </div>
                          <p className="mt-1">
                            Upload a {newTemplate.headerType.toLowerCase()} file
                            to preview this header.
                          </p>
                        </div>
                      )}
                      {isMediaHeader && headerFile && (
                        <div className="mb-3">{mediaPreview}</div>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {previewContent}
                      </p>
                      {previewFooter && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          {previewFooter}
                        </p>
                      )}
                      {previewButtons.length > 0 && (
                        <div className="mt-4 space-y-2 border-t pt-3">
                          {previewButtons.map((button, index) => (
                            <button
                              key={index}
                              type="button"
                              className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-primary"
                            >
                              {button.type === "URL" && (
                                <Link2 className="h-4 w-4" />
                              )}
                              {button.type === "CALL" && (
                                <Phone className="h-4 w-4" />
                              )}
                              {button.type === "QUICK_REPLY" && (
                                <MessageCircle className="h-4 w-4" />
                              )}
                              {button.text ||
                                `${formatLabel(button.type)} Button`}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="mt-3 text-right text-[11px] text-muted-foreground">
                        12:00 PM
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{templateType}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Buttons</p>
                      <p className="font-medium">{previewButtons.length}/3</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">
                        {formatLabel(newTemplate.category)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Variables</p>
                      <p className="font-medium">{variableCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Approval Checklist
                  </CardTitle>
                  <CardDescription>
                    Quick QA before you submit the template.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {readinessChecks.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span>{item.label}</span>
                      {item.done ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  ))}
                  <div
                    className={`rounded-lg border px-3 py-2 text-sm font-medium ${healthTone}`}
                  >
                    {completeChecks}/{readinessChecks.length} checks complete
                  </div>
                  <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    Current backend creates templates as `DRAFT`. This builder
                    helps you make them approval-ready before submission.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Content Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span className="text-muted-foreground">Body Length</span>
                    <span>{newTemplate.body.length} chars</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span className="text-muted-foreground">Header Length</span>
                    <span>{newTemplate.headerText.length} chars</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span className="text-muted-foreground">Footer Length</span>
                    <span>{newTemplate.footerText.length} chars</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span className="text-muted-foreground">Media File</span>
                    <span>{headerFile?.name || "None"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Validation & Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">
                      Submission blockers
                    </p>
                    {validationIssues.length === 0 ? (
                      <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-700">
                        No blocking issues detected right now.
                      </div>
                    ) : (
                      validationIssues.map((issue) => (
                        <div
                          key={issue}
                          className="flex items-start gap-2 rounded-lg border px-3 py-2 text-muted-foreground"
                        >
                          <ChevronRight className="mt-0.5 h-4 w-4 text-amber-500" />
                          <span>{issue}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">
                      Performance tips
                    </p>
                    {guidanceTips.length === 0 ? (
                      <div className="rounded-lg border border-dashed px-3 py-2 text-muted-foreground">
                        Template already looks balanced from a UX perspective.
                      </div>
                    ) : (
                      guidanceTips.map((tip) => (
                        <div
                          key={tip}
                          className="rounded-lg border border-dashed px-3 py-2 text-muted-foreground"
                        >
                          {tip}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap justify-end gap-2">
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
                <Button onClick={handleCreate}>
                  {isCreating
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                      ? "Update Template"
                      : "Create Template"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
