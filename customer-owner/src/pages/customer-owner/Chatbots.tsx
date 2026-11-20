import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bold,
  Bot,
  Code2,
  Info,
  Italic,
  Loader2,
  MoreVertical,
  Pause,
  Play,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Strikethrough,
  Trash2,
  Workflow,
} from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ConfirmModal } from "@/components/shared/Modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type BotItem = {
  botId: string;
  name: string;
  botType: string;
  triggerType: string;
  triggerValue?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  replyType?: string | null;
  replyId?: string | null;
};

type Section = "basic" | "flows" | "ai";
type BasicView = "list" | "create";
type ResponseType = "text" | "image" | "audio";

type FlowItem = {
  id: string;
  name: string;
  description: string;
  status: "Draft" | "Active" | "Paused";
  runs: number;
  updatedAt: string;
};

const FLOWS_KEY = "chatflow-automations-flows-v1";

const VARIABLES = [
  "First Name",
  "Last Name",
  "Full Name",
  "Email",
  "Phone",
  "Group",
  "Organization Name",
  "Address",
  "Street",
  "City",
  "State",
  "Zip Code",
  "Country",
];

function toVarToken(label: string, encoded = false) {
  const base = label.toLowerCase().replace(/\s+/g, "_");
  return `{{${encoded ? `${base}_url` : base}}}`;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function matchCriteriaLabel(triggerType: string) {
  if (triggerType === "IS") return "Exact match";
  if (triggerType === "CONTAINS") return "Contains";
  if (triggerType === "STARTS_WITH") return "Starts with";
  if (triggerType === "ENDS_WITH") return "Ends with";
  if (triggerType === "WELCOME") return "Welcome";
  if (triggerType === "DEFAULT") return "Default";
  return triggerType;
}

function responseTypeLabel(replyType?: string | null) {
  if (!replyType || replyType === "SIMPLE" || replyType === "TEXT") {
    return "Respond with text";
  }
  return replyType;
}

function loadFlows(): FlowItem[] {
  try {
    const raw = localStorage.getItem(FLOWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFlows(items: FlowItem[]) {
  localStorage.setItem(FLOWS_KEY, JSON.stringify(items));
}

export default function Chatbots() {
  const { toast } = useToast();

  const [section, setSection] = useState<Section>("basic");
  const [basicView, setBasicView] = useState<BasicView>("list");

  const [bots, setBots] = useState<BotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [triggerText, setTriggerText] = useState("");
  const [matchCriteria, setMatchCriteria] = useState<"IS" | "CONTAINS">("CONTAINS");
  const [responseType, setResponseType] = useState<ResponseType>("text");
  const [bodyText, setBodyText] = useState("");
  const [variableOpen, setVariableOpen] = useState(false);

  const [flows, setFlows] = useState<FlowItem[]>(() => loadFlows());
  const [flowSearch, setFlowSearch] = useState("");
  const [flowModalOpen, setFlowModalOpen] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [flowDescription, setFlowDescription] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadBots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "100" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const json = await apiFetch(
        `/user/whatsapp/bot/list?${params.toString()}`,
      );
      setBots(json.data?.list || []);
    } catch (error) {
      toast({
        title: "Unable to load automations",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, toast]);

  useEffect(() => {
    if (section === "basic" && basicView === "list") {
      loadBots();
    }
  }, [section, basicView, loadBots]);

  const filteredFlows = useMemo(() => {
    const q = flowSearch.trim().toLowerCase();
    if (!q) return flows;
    return flows.filter((f) => f.name.toLowerCase().includes(q));
  }, [flowSearch, flows]);

  const resetCreateForm = () => {
    setName("");
    setTriggerText("");
    setMatchCriteria("CONTAINS");
    setResponseType("text");
    setBodyText("");
  };

  const openCreate = () => {
    resetCreateForm();
    setBasicView("create");
  };

  const wrapSelection = (before: string, after = before) => {
    const el = document.getElementById(
      "automation-text-response",
    ) as HTMLTextAreaElement | null;
    if (!el) {
      setBodyText((current) => `${current}${before}${after}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = bodyText.slice(start, end) || "text";
    const next =
      bodyText.slice(0, start) + before + selected + after + bodyText.slice(end);
    setBodyText(next);
  };

  const insertVariable = (label: string, encoded = false) => {
    const token = toVarToken(label, encoded);
    setBodyText((current) => `${current}${current ? " " : ""}${token}`);
    setVariableOpen(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }
    if (!triggerText.trim()) {
      toast({
        title: "Validation",
        description: "Trigger text is required",
        variant: "destructive",
      });
      return;
    }
    if (responseType !== "text") {
      toast({
        title: "Coming soon",
        description: "Only text responses are supported right now.",
        variant: "destructive",
      });
      return;
    }
    if (!bodyText.trim()) {
      toast({
        title: "Validation",
        description: "Text response is required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch(`/user/whatsapp/bot/createSimpleBot`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          bodyText: bodyText.trim(),
          triggerType: matchCriteria,
          triggerValue: triggerText.trim(),
          isActive: true,
        }),
      });
      toast({
        title: "Automation created",
        description: `${name.trim()} is ready.`,
      });
      resetCreateForm();
      setBasicView("list");
      await loadBots();
    } catch (error) {
      toast({
        title: "Create failed",
        description:
          error instanceof Error ? error.message : "Unable to create automation",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (bot: BotItem) => {
    try {
      await apiFetch(`/user/whatsapp/bot/status`, {
        method: "PATCH",
        body: JSON.stringify({ id: bot.botId, isActive: !bot.isActive }),
      });
      toast({
        title: bot.isActive ? "Paused" : "Activated",
        description: bot.name,
      });
      await loadBots();
    } catch (error) {
      toast({
        title: "Status update failed",
        description:
          error instanceof Error ? error.message : "Unable to update status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    setSubmitting(true);
    try {
      await apiFetch(`/user/whatsapp/bot/delete`, {
        method: "DELETE",
        body: JSON.stringify({ id: pendingDeleteId }),
      });
      toast({ title: "Deleted", description: "Basic reply removed." });
      setDeleteOpen(false);
      setPendingDeleteId(null);
      await loadBots();
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Unable to delete",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFlow = () => {
    if (!flowName.trim()) {
      toast({
        title: "Validation",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }
    const next: FlowItem = {
      id: crypto.randomUUID(),
      name: flowName.trim(),
      description: flowDescription.trim(),
      status: "Draft",
      runs: 0,
      updatedAt: new Date().toISOString(),
    };
    const updated = [next, ...flows];
    setFlows(updated);
    saveFlows(updated);
    setFlowModalOpen(false);
    setFlowName("");
    setFlowDescription("");
    toast({
      title: "Automation created",
      description: "Draft saved. Flow builder can be connected next.",
    });
  };

  const deleteFlow = (id: string) => {
    const updated = flows.filter((f) => f.id !== id);
    setFlows(updated);
    saveFlows(updated);
  };

  const navItems: Array<{
    id: Section;
    label: string;
    icon: typeof Settings2;
  }> = [
    { id: "basic", label: "Basic Replies", icon: Settings2 },
    { id: "flows", label: "Automations", icon: Workflow },
    { id: "ai", label: "AI Reply Assistant", icon: Sparkles },
  ];

  if (basicView === "create" && section === "basic") {
    return (
      <div className="flex flex-col h-full min-h-0 w-full">
        <Header title="Create automation" subtitle="Create reply automation" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Create automation
                  </h1>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Create reply automation using your own criteria.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-200"
                  onClick={() => {
                    setBasicView("list");
                    resetCreateForm();
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
                  <Label className="text-sm font-medium text-slate-700">
                    Name
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Welcome reply"
                    className="h-11"
                  />
                </div>

                <div className="border-t border-slate-100 pt-6 grid gap-2 sm:grid-cols-[160px_1fr]">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Trigger
                    </Label>
                    <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      Add the string of text responsible for triggering the
                      response.
                    </p>
                  </div>
                  <Textarea
                    value={triggerText}
                    onChange={(e) => setTriggerText(e.target.value)}
                    rows={4}
                    className="resize-none"
                    placeholder="hi"
                  />
                </div>

                <div className="border-t border-slate-100 pt-6 grid gap-2 sm:grid-cols-[160px_1fr]">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Match Criteria
                    </Label>
                    <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      Select the criteria for matching the trigger text above.
                    </p>
                  </div>
                  <Select
                    value={matchCriteria}
                    onValueChange={(value: "IS" | "CONTAINS") =>
                      setMatchCriteria(value)
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select Criteria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IS">
                        When text is an exact match to trigger text
                      </SelectItem>
                      <SelectItem value="CONTAINS">
                        When text contains trigger text
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-slate-100 pt-6 grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
                  <Label className="text-sm font-medium text-slate-700">
                    Response Type
                  </Label>
                  <Select
                    value={responseType}
                    onValueChange={(value: ResponseType) =>
                      setResponseType(value)
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Respond with text</SelectItem>
                      <SelectItem value="image">Respond with image</SelectItem>
                      <SelectItem value="audio">Respond with audio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {responseType === "text" ? (
                  <div className="border-t border-slate-100 pt-6 grid gap-2 sm:grid-cols-[160px_1fr]">
                    <Label className="text-sm font-medium text-slate-700">
                      Text Response
                    </Label>
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      <Textarea
                        id="automation-text-response"
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        rows={7}
                        className="resize-none border-0 focus-visible:ring-0 rounded-none"
                        placeholder="Hi {{first_name}}, thanks for messaging us..."
                      />
                      <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setVariableOpen(true)}
                        >
                          Add Variable
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => wrapSelection("*")}
                            title="Bold"
                          >
                            <Bold className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => wrapSelection("_")}
                            title="Italic"
                          >
                            <Italic className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => wrapSelection("~")}
                            title="Strikethrough"
                          >
                            <Strikethrough className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => wrapSelection("```", "```")}
                            title="Code"
                          >
                            <Code2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 pt-6">
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      {responseType === "image"
                        ? "Image responses are coming soon. Choose “Respond with text” to save now."
                        : "Audio responses are coming soon. Choose “Respond with text” to save now."}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                <Button
                  className="bg-slate-900 hover:bg-slate-800 text-white min-w-24"
                  onClick={handleCreate}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>

        <Modal
          open={variableOpen}
          onOpenChange={setVariableOpen}
          title="Select variable"
          description="Select a placeholder to add to your response. The placeholder will replace itself with the actual data."
          size="lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
            {VARIABLES.map((label) => (
              <button
                key={label}
                type="button"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm text-slate-700 hover:border-primary/40 hover:bg-primary/5"
                onClick={() => insertVariable(label)}
              >
                {label}
              </button>
            ))}
            {VARIABLES.map((label) => (
              <button
                key={`${label}-url`}
                type="button"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm text-slate-700 hover:border-primary/40 hover:bg-primary/5"
                onClick={() => insertVariable(label, true)}
              >
                {label} (URL encoded)
              </button>
            ))}
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header
        title="Automation"
        subtitle="Respond automatically to messages based on your own criteria"
      />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Automation</h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Respond automatically to messages based on your own criteria
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start">
            <aside className="rounded-xl border border-slate-200 bg-white p-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(item.id);
                      setBasicView("list");
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-left transition-colors",
                      active
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </aside>

            <section className="rounded-xl border border-slate-200 bg-white min-h-[520px] overflow-hidden">
              {section === "basic" && (
                <>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Basic Replies
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Respond automatically to messages based on your own
                        criteria.
                      </p>
                    </div>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={openCreate}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Create
                    </Button>
                  </div>

                  <div className="px-5 py-4 border-b border-slate-100">
                    <div className="relative max-w-xl">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search by name or trigger text."
                        className="pl-9 h-11 bg-white border-slate-200"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      {search !== debouncedSearch && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-[720px]">
                      <div className="grid grid-cols-[1.2fr_1.2fr_1fr_1.1fr_0.9fr_48px] gap-2 px-5 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <span>Name</span>
                        <span>Trigger Text</span>
                        <span>Match Criteria</span>
                        <span>Response Type</span>
                        <span>Last Updated</span>
                        <span />
                      </div>

                      {loading ? (
                        <div className="py-20 flex items-center justify-center gap-2 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </div>
                      ) : bots.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                          <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <Bot className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="text-sm font-semibold text-slate-800">
                            No basic replies yet
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            Create a reply automation to get started.
                          </p>
                          <Button
                            className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={openCreate}
                          >
                            Create
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {bots.map((bot) => (
                            <div
                              key={bot.botId}
                              className="grid grid-cols-[1.2fr_1.2fr_1fr_1.1fr_0.9fr_48px] gap-2 px-5 py-4 items-center hover:bg-slate-50/80"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {bot.name}
                                </p>
                                <Badge
                                  className={cn(
                                    "mt-1 text-[10px]",
                                    bot.isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800",
                                  )}
                                >
                                  {bot.isActive ? "Active" : "Paused"}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 truncate">
                                {bot.triggerValue || "—"}
                              </p>
                              <p className="text-sm text-slate-600">
                                {matchCriteriaLabel(bot.triggerType)}
                              </p>
                              <p className="text-sm text-slate-600">
                                {responseTypeLabel(bot.replyType)}
                              </p>
                              <p className="text-sm text-slate-600">
                                {formatDate(bot.updatedAt || bot.createdAt)}
                              </p>
                              <div className="flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => toggleStatus(bot)}
                                    >
                                      {bot.isActive ? (
                                        <>
                                          <Pause className="h-4 w-4 mr-2" />
                                          Pause
                                        </>
                                      ) : (
                                        <>
                                          <Play className="h-4 w-4 mr-2" />
                                          Activate
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => {
                                        setPendingDeleteId(bot.botId);
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
                  </div>
                </>
              )}

              {section === "flows" && (
                <>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        My Automations
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Respond automatically to messages based on your own
                        criteria.
                      </p>
                    </div>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => {
                        setFlowName("");
                        setFlowDescription("");
                        setFlowModalOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      New Automation
                    </Button>
                  </div>

                  <div className="px-5 py-4 border-b border-slate-100">
                    <div className="relative max-w-xl">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search by name."
                        className="pl-9 h-11"
                        value={flowSearch}
                        onChange={(e) => setFlowSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="min-w-[560px]">
                    <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr_1fr_48px] gap-2 px-5 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>Name</span>
                      <span>Runs</span>
                      <span>Status</span>
                      <span>Last Updated</span>
                      <span />
                    </div>

                    {filteredFlows.length === 0 ? (
                      <div className="py-20 text-center text-sm text-slate-500">
                        No automations yet. Create one to get started.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {filteredFlows.map((flow) => (
                          <div
                            key={flow.id}
                            className="grid grid-cols-[1.4fr_0.7fr_0.8fr_1fr_48px] gap-2 px-5 py-4 items-center hover:bg-slate-50/80"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {flow.name}
                              </p>
                              {flow.description ? (
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {flow.description}
                                </p>
                              ) : null}
                            </div>
                            <p className="text-sm text-slate-600">{flow.runs}</p>
                            <Badge className="w-fit bg-slate-100 text-slate-700">
                              {flow.status}
                            </Badge>
                            <p className="text-sm text-slate-600">
                              {formatDate(flow.updatedAt)}
                            </p>
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => deleteFlow(flow.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {section === "ai" && (
                <div className="py-24 px-6 flex flex-col items-center text-center">
                  <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-slate-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    AI Reply Assistant
                  </h2>
                  <p className="text-sm text-slate-500 mt-2 max-w-md">
                    AI-assisted replies will live here. Basic Replies and
                    Automations are available now.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Modal
        open={flowModalOpen}
        onOpenChange={setFlowModalOpen}
        title="Create Automation"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="Lead follow-up"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={flowDescription}
              onChange={(e) => setFlowDescription(e.target.value)}
              rows={4}
              placeholder="Optional notes about this automation"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFlowModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleCreateFlow}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setPendingDeleteId(null);
        }}
        title="Delete basic reply?"
        description="This permanently removes the automation and its reply."
        confirmText={submitting ? "Deleting..." : "Delete"}
        variant="destructive"
        loading={submitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
