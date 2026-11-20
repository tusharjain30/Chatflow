import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Send,
  Loader2,
  MessageSquare,
  MoreVertical,
  Phone,
  X,
  Trash2,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

type MessageLog = {
  id: string;
  to: string;
  from?: string | null;
  direction: "INBOUND" | "OUTBOUND";
  messageText?: string | null;
  status: string;
  conversationId?: string | null;
  createdAt: string;
};

type Conversation = {
  key: string;
  phone: string;
  name?: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: MessageLog[];
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function peerPhone(msg: MessageLog) {
  if (msg.direction === "INBOUND") return msg.from || msg.to;
  return msg.to;
}

function phonesMatch(a: string, b: string) {
  const left = digitsOnly(a);
  const right = digitsOnly(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.endsWith(right) || right.endsWith(left);
}

function formatListTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    hour: "numeric",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

function initialsFrom(nameOrPhone: string) {
  const cleaned = nameOrPhone.replace(/^\+/, "").trim();
  if (!cleaned) return "WA";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (/^\d+$/.test(cleaned)) return cleaned.slice(-2);
  return cleaned.slice(0, 2).toUpperCase();
}

export default function Inbox() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [contactNames, setContactNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDeleteKeys, setPendingDeleteKeys] = useState<string[]>([]);
  const [pendingContact, setPendingContact] = useState<{
    phone: string;
    name?: string;
  } | null>(null);

  const queryPhone = digitsOnly(searchParams.get("phone") || "");
  const queryName = searchParams.get("name") || undefined;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [messagesJson, contactsJson] = await Promise.all([
        apiFetch(
          `/user/whatsapp/message/list?page=1&limit=100${
            debouncedSearch
              ? `&search=${encodeURIComponent(debouncedSearch)}`
              : ""
          }`,
        ),
        apiFetch("/user/contacts/contact/read?page=1&limit=200").catch(
          () => null,
        ),
      ]);

      setMessages(messagesJson.data?.messages || []);

      const nameMap: Record<string, string> = {};
      const contacts = contactsJson?.data?.contacts || [];
      for (const contact of contacts) {
        const phone = digitsOnly(contact.phone || "");
        if (!phone) continue;
        const name = [contact.firstName, contact.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (name) nameMap[phone] = name;
      }
      setContactNames(nameMap);
    } catch (error) {
      toast({
        title: "Unable to load inbox",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!queryPhone) return;
    setPendingContact({ phone: queryPhone, name: queryName });
    setSearch("");
    setDebouncedSearch("");
  }, [queryPhone, queryName]);

  const resolveName = useCallback(
    (phone: string, fallback?: string) => {
      if (fallback) return fallback;
      const digits = digitsOnly(phone);
      for (const [key, name] of Object.entries(contactNames)) {
        if (phonesMatch(key, digits)) return name;
      }
      return undefined;
    },
    [contactNames],
  );

  const conversations = useMemo(() => {
    const map = new Map<string, Conversation>();
    for (const msg of messages) {
      const phone = peerPhone(msg);
      const key = msg.conversationId || phone;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          phone,
          name: resolveName(phone),
          lastMessage: msg.messageText || msg.status,
          time: formatListTime(msg.createdAt),
          unread: msg.direction === "INBOUND" && msg.status !== "READ" ? 1 : 0,
          messages: [msg],
        });
      } else {
        existing.messages.push(msg);
        const newest = [...existing.messages].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
        existing.lastMessage = newest.messageText || newest.status;
        existing.time = formatListTime(newest.createdAt);
        if (msg.direction === "INBOUND" && msg.status !== "READ") {
          existing.unread += 1;
        }
      }
    }

    let list = Array.from(map.values()).map((conv) => ({
      ...conv,
      name: resolveName(conv.phone, conv.name),
      messages: [...conv.messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    }));

    list = list.sort((a, b) => {
      const aTime = a.messages.at(-1)?.createdAt || "";
      const bTime = b.messages.at(-1)?.createdAt || "";
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    if (
      pendingContact &&
      !list.some((conv) => phonesMatch(conv.phone, pendingContact.phone))
    ) {
      list.unshift({
        key: `contact:${pendingContact.phone}`,
        phone: pendingContact.phone,
        name: pendingContact.name || resolveName(pendingContact.phone),
        lastMessage: "Start a new conversation",
        time: "Now",
        unread: 0,
        messages: [],
      });
    } else if (pendingContact) {
      list = list.map((conv) =>
        phonesMatch(conv.phone, pendingContact.phone)
          ? {
              ...conv,
              name:
                pendingContact.name ||
                resolveName(conv.phone, conv.name) ||
                conv.name,
            }
          : conv,
      );
    }

    return list;
  }, [messages, pendingContact, resolveName]);

  // Only auto-open when arriving from Contacts "Chat" deep-link — never on normal load
  useEffect(() => {
    if (!pendingContact || !conversations.length) return;
    const match = conversations.find((conv) =>
      phonesMatch(conv.phone, pendingContact.phone),
    );
    if (match) setSelectedKey(match.key);
  }, [conversations, pendingContact]);

  const selected = conversations.find((c) => c.key === selectedKey) || null;

  const selectionMode = selectedIds.length > 0;
  const allSelected =
    conversations.length > 0 && selectedIds.length === conversations.length;

  const toggleSelectAll = () => {
    setSelectedIds(conversations.map((c) => c.key));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const toggleSelectOne = (key: string) => {
    setSelectedIds((prev) =>
      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key],
    );
  };

  const requestDeleteChats = (keys: string[]) => {
    const validKeys = keys.filter(Boolean);
    if (!validKeys.length) return;
    setPendingDeleteKeys(validKeys);
    setDeleteOpen(true);
  };

  const handleDeleteChats = async () => {
    if (!pendingDeleteKeys.length) return;

    const chats = conversations
      .filter((conv) => pendingDeleteKeys.includes(conv.key))
      .map((conv) => ({
        conversationId: conv.key.startsWith("contact:")
          ? undefined
          : conv.key,
        phone: digitsOnly(conv.phone),
      }))
      .filter((chat) => chat.conversationId || chat.phone);

    if (!chats.length) {
      setDeleteOpen(false);
      return;
    }

    setDeleting(true);
    try {
      const json = await apiFetch("/user/whatsapp/message/delete-conversations", {
        method: "POST",
        body: JSON.stringify({ chats }),
      });

      toast({
        title: "Chats deleted",
        description:
          json.message ||
          `${pendingDeleteKeys.length} conversation(s) removed from inbox.`,
      });

      if (selectedKey && pendingDeleteKeys.includes(selectedKey)) {
        setSelectedKey(null);
        setDraft("");
      }
      setSelectedIds((prev) =>
        prev.filter((id) => !pendingDeleteKeys.includes(id)),
      );
      setPendingDeleteKeys([]);
      setDeleteOpen(false);
      await load();
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Unable to delete chats",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const sendMessage = async () => {
    if (!selected || !draft.trim()) return;
    setSending(true);
    try {
      await apiFetch("/user/whatsapp/message/send-text", {
        method: "POST",
        body: JSON.stringify({
          to: digitsOnly(selected.phone),
          message: draft.trim(),
        }),
      });
      setDraft("");
      if (searchParams.has("phone")) {
        const next = new URLSearchParams(searchParams);
        next.delete("phone");
        next.delete("name");
        setSearchParams(next, { replace: true });
        setPendingContact(null);
      }
      await load();
    } catch (error) {
      toast({
        title: "Send failed",
        description:
          error instanceof Error ? error.message : "Unable to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const displayName = (conv: Conversation) =>
    conv.name || `+${digitsOnly(conv.phone)}`;

  return (
    <div className="flex h-full min-h-0 w-full bg-white">
      {/* Conversation list */}
      <aside className="w-[320px] border-r border-slate-200 flex flex-col min-h-0 bg-white">
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 space-y-3">
          {selectionMode ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-primary-foreground stroke-[2.5]" />
                  </div>
                  <p className="text-[15px] font-semibold text-slate-800 truncate">
                    {selectedIds.length} chat
                    {selectedIds.length === 1 ? "" : "s"} selected
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                  title="Delete selected chats"
                  onClick={() => requestDeleteChats(selectedIds)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <button
                  type="button"
                  className="font-medium text-primary hover:underline disabled:opacity-50"
                  disabled={allSelected || conversations.length === 0}
                  onClick={toggleSelectAll}
                >
                  Select all chats
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  className="font-medium text-slate-600 hover:text-slate-900 hover:underline"
                  onClick={clearSelection}
                >
                  Cancel selection
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-lg font-semibold text-slate-900">Chats</h1>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                    {conversations.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500"
                  onClick={() => setSearchOpen((v) => !v)}
                >
                  {searchOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {searchOpen && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    autoFocus
                    placeholder="Search by name, phone, or message..."
                    className="pl-9 h-9 bg-slate-50 border-slate-200"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search !== debouncedSearch && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-slate-400" />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading chats...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-700">
                {debouncedSearch ? "No chats found" : "No chats yet"}
              </p>
              <p className="text-xs text-slate-500">
                {debouncedSearch
                  ? "Try a different name, phone, or message keyword."
                  : "Open Contacts and tap Chat to start a conversation."}
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const active = !selectionMode && selectedKey === conv.key;
              const checked = selectedIds.includes(conv.key);
              const label = displayName(conv);
              return (
                <div
                  key={conv.key}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors",
                    checked || active ? "bg-slate-100" : "hover:bg-slate-50",
                  )}
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelectOne(conv.key);
                      return;
                    }
                    setSelectedKey(conv.key);
                  }}
                >
                  <button
                    type="button"
                    className="relative shrink-0"
                    title={checked ? "Deselect chat" : "Select chat"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectOne(conv.key);
                    }}
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-semibold">
                        {initialsFrom(label)}
                      </AvatarFallback>
                    </Avatar>
                    {checked ? (
                      <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground stroke-[3]" />
                      </span>
                    ) : (
                      <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 border-slate-300 bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {label}
                      </p>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {conv.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-[13px] text-slate-500 truncate">
                        {conv.lastMessage}
                      </p>
                      {!checked && conv.unread > 0 && (
                        <Badge className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5">
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Conversation pane */}
      <section className="flex-1 flex flex-col min-w-0 min-h-0">
        {selected && !selectionMode ? (
          <>
            <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initialsFrom(displayName(selected))}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {displayName(selected)}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    +{digitsOnly(selected.phone)}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => requestDeleteChats([selected.key])}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
              style={{
                backgroundColor: "#EFEAE2",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc4' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {selected.messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="bg-white/90 rounded-xl px-4 py-3 text-sm text-slate-600 shadow-sm">
                    No messages yet. Send the first WhatsApp message below.
                  </div>
                </div>
              ) : (
                selected.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                      msg.direction === "OUTBOUND"
                        ? "ml-auto bg-primary text-primary-foreground rounded-br-md"
                        : "bg-white text-slate-800 rounded-bl-md",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {msg.messageText || `[${msg.status}]`}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] mt-1 text-right",
                        msg.direction === "OUTBOUND"
                          ? "text-primary-foreground/75"
                          : "text-slate-400",
                      )}
                    >
                      {formatMessageTime(msg.createdAt)}
                      {msg.direction === "OUTBOUND" ? ` · ${msg.status}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
              <Input
                placeholder="Type a message..."
                className="h-11 rounded-full bg-slate-50 border-slate-200 px-4"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                size="icon"
                className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 shrink-0"
                onClick={sendMessage}
                disabled={sending || !draft.trim()}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        ) : (
          <div
            className="flex-1 flex items-center justify-center min-h-0"
            style={{
              backgroundColor: "#EFEAE2",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc4' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            <div className="text-center space-y-3 px-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-white/90 shadow-sm flex items-center justify-center">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">
                  Select a chat to start messaging
                </p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Choose a conversation from the left, or open a contact and
                  click Chat.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setPendingDeleteKeys([]);
        }}
        title={
          pendingDeleteKeys.length > 1
            ? `Delete ${pendingDeleteKeys.length} chats?`
            : "Delete chat?"
        }
        description="This permanently removes the conversation history from your inbox. This cannot be undone."
        confirmText={deleting ? "Deleting..." : "Delete"}
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteChats}
      />
    </div>
  );
}
