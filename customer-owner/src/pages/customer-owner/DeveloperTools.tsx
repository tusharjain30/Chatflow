import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal, ConfirmModal } from "@/components/shared/Modal";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type TabKey = "tokens" | "webhooks";
type DocLang = "CURL" | "PHP" | "NODEJS" | "PYTHON" | "JAVA" | "RUBY";

type AccessTokenItem = {
  id: string;
  label?: string;
  service?: string;
  maskedToken: string;
  preview?: string | null;
  createdAt: string;
  revealedToken?: string;
};

type WebhookItem = {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
};

const WEBHOOK_EVENTS = [
  "Message.Received",
  "Message.Sent",
  "Message.Status.Update",
  "Contact.Created",
  "Contact.Updated",
  "Contact.Deleted",
  "Group.Created",
  "Group.Updated",
  "Group.Deleted",
  "Autoreply.Created",
  "Autoreply.Updated",
  "Autoreply.Deleted",
];

const API_DOCS = [
  {
    group: "Verify API",
    items: [{ method: "GET", title: "Verify API key" }],
  },
  {
    group: "Contacts",
    items: [
      { method: "GET", title: "Get Contact List" },
      { method: "POST", title: "Add Contact" },
      { method: "PUT", title: "Edit Contact" },
      { method: "DELETE", title: "Delete Contact" },
    ],
  },
  {
    group: "Contact Groups",
    items: [
      { method: "GET", title: "Get Contact Group List" },
      { method: "POST", title: "Add Contact Group" },
      { method: "PUT", title: "Edit Contact Group" },
      { method: "DELETE", title: "Delete Contact Group" },
    ],
  },
  {
    group: "Automated Replies",
    items: [
      { method: "GET", title: "Get automated replies list" },
      { method: "POST", title: "Add automated reply" },
      { method: "PUT", title: "Edit automated reply" },
      { method: "DELETE", title: "Delete automated reply" },
    ],
  },
  {
    group: "WhatsApp Lines",
    items: [
      { method: "GET", title: "Get WhatsApp lines" },
      { method: "POST", title: "Connect WhatsApp line" },
    ],
  },
];

function methodColor(method: string) {
  if (method === "GET") return "bg-emerald-500";
  if (method === "POST") return "bg-sky-500";
  if (method === "PUT") return "bg-teal-500";
  return "bg-rose-500";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function DeveloperTools() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>("tokens");
  const [docLang, setDocLang] = useState<DocLang>("CURL");

  const [tokens, setTokens] = useState<AccessTokenItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [webhookOpen, setWebhookOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [savingWebhook, setSavingWebhook] = useState(false);

  const loadTokens = useCallback(async () => {
    const json = await apiFetch(`/user/developer/tokens`);
    setTokens(json.data?.tokens || []);
  }, []);

  const loadWebhooks = useCallback(async () => {
    const json = await apiFetch(`/user/developer/webhooks`);
    setWebhooks(json.data?.webhooks || []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadTokens(), loadWebhooks()]);
    } catch (error) {
      toast({
        title: "Unable to load developer tools",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loadTokens, loadWebhooks, toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const json = await apiFetch(`/user/developer/tokens/generate`, {
        method: "POST",
        body: JSON.stringify({ label: "API key" }),
      });
      const created = json.data;
      toast({
        title: "API key generated",
        description: "Copy and store it securely. Full key is shown once.",
      });
      setTokens((prev) => [
        {
          id: created.id,
          label: created.label,
          service: created.service,
          maskedToken: created.maskedToken,
          preview: created.preview,
          createdAt: created.createdAt,
          revealedToken: created.token,
        },
        ...prev,
      ]);
      setRevealedIds((prev) => [...prev, created.id]);
    } catch (error) {
      toast({
        title: "Generate failed",
        description:
          error instanceof Error ? error.message : "Unable to generate key",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteToken = async () => {
    if (!deleteTokenId) return;
    setDeleting(true);
    try {
      await apiFetch(`/user/developer/tokens/${deleteTokenId}`, {
        method: "DELETE",
      });
      setTokens((prev) => prev.filter((t) => t.id !== deleteTokenId));
      setDeleteTokenId(null);
      toast({ title: "API key deleted" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Unable to delete key",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Validation",
        description: "URL is required",
        variant: "destructive",
      });
      return;
    }
    if (webhookEvents.length === 0) {
      toast({
        title: "Validation",
        description: "Select at least one event",
        variant: "destructive",
      });
      return;
    }

    setSavingWebhook(true);
    try {
      const json = await apiFetch(`/user/developer/webhooks/create`, {
        method: "POST",
        body: JSON.stringify({
          url: webhookUrl.trim(),
          events: webhookEvents,
        }),
      });
      setWebhooks((prev) => [json.data, ...prev]);
      setWebhookOpen(false);
      setWebhookUrl("");
      setWebhookEvents([]);
      toast({ title: "Webhook saved" });
    } catch (error) {
      toast({
        title: "Save failed",
        description:
          error instanceof Error ? error.message : "Unable to save webhook",
        variant: "destructive",
      });
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!deleteWebhookId) return;
    setDeleting(true);
    try {
      await apiFetch(`/user/developer/webhooks/${deleteWebhookId}`, {
        method: "DELETE",
      });
      setWebhooks((prev) => prev.filter((w) => w.id !== deleteWebhookId));
      setDeleteWebhookId(null);
      toast({ title: "Webhook deleted" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Unable to delete webhook",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const copyToken = async (token: AccessTokenItem) => {
    const value = token.revealedToken || token.maskedToken;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(token.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const selectedCount = useMemo(() => webhookEvents.length, [webhookEvents]);

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header title="Developer Tools" subtitle="API keys and webhooks" />
      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-h-0 overflow-auto p-6">
            <div className="max-w-4xl space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Developer Tools
                </h1>
                <div className="mt-4 flex items-center gap-5 border-b border-slate-200">
                  {(
                    [
                      ["tokens", "Access Token"],
                      ["webhooks", "Webhooks"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={cn(
                        "pb-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                        tab === key
                          ? "border-primary text-primary"
                          : "border-transparent text-slate-500 hover:text-slate-800",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {tab === "tokens" ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Access Tokens
                      </h2>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5" />
                        Create & manage your api keys
                      </p>
                    </div>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleGenerate}
                      disabled={generating}
                    >
                      {generating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Generate API key
                    </Button>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden min-h-[280px]">
                    <div className="grid grid-cols-[1.6fr_1fr_48px] gap-2 px-5 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>Token</span>
                      <span>Created On</span>
                      <span />
                    </div>

                    {loading ? (
                      <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading tokens...
                      </div>
                    ) : tokens.length === 0 ? (
                      <div className="py-16 text-center text-sm text-slate-500">
                        No API keys yet. Generate one to get started.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {tokens.map((token) => {
                          const revealed = revealedIds.includes(token.id);
                          const display =
                            revealed && token.revealedToken
                              ? token.revealedToken
                              : token.maskedToken;
                          return (
                            <div
                              key={token.id}
                              className="grid grid-cols-[1.6fr_1fr_48px] gap-2 px-5 py-4 items-center"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <code className="text-sm text-slate-800 truncate font-medium">
                                  {display}
                                </code>
                                {token.revealedToken ? (
                                  <button
                                    type="button"
                                    className="text-slate-500 hover:text-slate-800"
                                    onClick={() =>
                                      setRevealedIds((prev) =>
                                        prev.includes(token.id)
                                          ? prev.filter((id) => id !== token.id)
                                          : [...prev, token.id],
                                      )
                                    }
                                  >
                                    {revealed ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="text-slate-500 hover:text-slate-800"
                                  onClick={() => copyToken(token)}
                                >
                                  {copiedId === token.id ? (
                                    <Check className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              <p className="text-sm text-slate-600">
                                {formatDate(token.createdAt)}
                              </p>
                              <div className="flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => setDeleteTokenId(token.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Webhooks
                      </h2>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5" />
                        Manage webhook urls and events
                      </p>
                    </div>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => setWebhookOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Webhook
                    </Button>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden min-h-[280px]">
                    <div className="grid grid-cols-[1.5fr_1.2fr_48px] gap-2 px-5 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>Notification URL</span>
                      <span>Events</span>
                      <span />
                    </div>

                    {loading ? (
                      <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading webhooks...
                      </div>
                    ) : webhooks.length === 0 ? (
                      <div className="py-16 text-center text-sm text-slate-500">
                        No webhooks configured yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {webhooks.map((webhook) => (
                          <div
                            key={webhook.id}
                            className="grid grid-cols-[1.5fr_1.2fr_48px] gap-2 px-5 py-4 items-center"
                          >
                            <p className="text-sm text-slate-800 truncate">
                              {webhook.url}
                            </p>
                            <p className="text-sm text-slate-600 truncate">
                              {webhook.events?.length
                                ? `${webhook.events.length} events`
                                : "—"}
                            </p>
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeleteWebhookId(webhook.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="hidden xl:flex flex-col min-h-0 bg-slate-950 text-slate-100 border-l border-slate-800">
            <div className="px-4 pt-4 pb-3 border-b border-slate-800 flex flex-wrap gap-2">
              {(
                ["CURL", "PHP", "NODEJS", "PYTHON", "JAVA", "RUBY"] as DocLang[]
              ).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setDocLang(lang)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide",
                    docLang === lang
                      ? "bg-white text-slate-900"
                      : "text-slate-400 hover:text-white",
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {API_DOCS.map((section) => (
                <div key={section.group} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {section.group}
                  </p>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div
                        key={`${section.group}-${item.title}`}
                        className="rounded-lg bg-white text-slate-900 px-3 py-2.5 flex items-center gap-2.5"
                      >
                        <span
                          className={cn(
                            "text-[10px] font-bold text-white rounded px-1.5 py-0.5",
                            methodColor(item.method),
                          )}
                        >
                          {item.method}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-slate-500 pt-2">
                Examples shown for {docLang}. Use your generated API key in the
                Authorization header.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Modal
        open={webhookOpen}
        onOpenChange={setWebhookOpen}
        title="Add Webhook"
        description="Send event notifications to your endpoint."
        size="lg"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://example.com/webhooks/chatflow"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Events</Label>
              <span className="text-xs text-slate-500">
                {selectedCount} selected
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
              {WEBHOOK_EVENTS.map((event) => {
                const checked = webhookEvents.includes(event);
                return (
                  <label
                    key={event}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        setWebhookEvents((prev) =>
                          value
                            ? [...prev, event]
                            : prev.filter((item) => item !== event),
                        );
                      }}
                    />
                    {event}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setWebhookOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleSaveWebhook}
              disabled={savingWebhook}
            >
              {savingWebhook ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTokenId)}
        onOpenChange={(open) => {
          if (!open) setDeleteTokenId(null);
        }}
        title="Delete API key?"
        description="This key will stop working immediately."
        confirmText={deleting ? "Deleting..." : "Delete"}
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteToken}
      />

      <ConfirmModal
        open={Boolean(deleteWebhookId)}
        onOpenChange={(open) => {
          if (!open) setDeleteWebhookId(null);
        }}
        title="Delete webhook?"
        description="Event notifications will no longer be sent to this URL."
        confirmText={deleting ? "Deleting..." : "Delete"}
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteWebhook}
      />
    </div>
  );
}
