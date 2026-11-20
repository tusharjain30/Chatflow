import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Info,
  LifeBuoy,
  Loader2,
  Plus,
} from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  CATEGORY_OPTIONS,
  formatTicketDateTime,
  formatTicketPretty,
  priorityLabel,
  type SupportTicket,
  type TicketCategoryKey,
} from "@/lib/supportTickets";

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "font-medium capitalize",
        status === "Open" && "bg-sky-100 text-sky-800 hover:bg-sky-100",
        status === "Resolved" &&
          "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
        status === "Closed" && "bg-slate-100 text-slate-700 hover:bg-slate-100",
      )}
    >
      {status}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const label = priorityLabel(priority);
  if (priority === "not_set" || priority === "NOT_SET") {
    return <span className="text-sm text-slate-600">{label}</span>;
  }
  return (
    <Badge
      className={cn(
        "font-medium capitalize",
        priority === "critical" && "bg-red-100 text-red-800 hover:bg-red-100",
        priority === "high" &&
          "bg-orange-100 text-orange-800 hover:bg-orange-100",
        priority === "medium" &&
          "bg-amber-100 text-amber-800 hover:bg-amber-100",
        priority === "low" && "bg-slate-100 text-slate-700 hover:bg-slate-100",
      )}
    >
      {label}
    </Badge>
  );
}

function TicketList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch(`/user/support/list?page=1&limit=50`);
      setTickets(json.data?.tickets || []);
    } catch (error) {
      toast({
        title: "Unable to load tickets",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header title="Support Tickets" subtitle="Have an issue? Create a ticket" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Support Tickets
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Have an issue? Create a ticket and one of our reps will be in
                touch.
              </p>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => navigate("/help/create")}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden min-h-[420px]">
            <div className="overflow-x-auto">
              <div className="min-w-[860px]">
                <div className="grid grid-cols-[1.3fr_1.6fr_0.8fr_0.8fr_1.2fr_40px] gap-2 px-5 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Ref.</span>
                  <span>Subject</span>
                  <span>Priority</span>
                  <span>Status</span>
                  <span>Last Updated</span>
                  <span />
                </div>

                {loading ? (
                  <div className="py-20 flex items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading tickets...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                    <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <LifeBuoy className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      No support tickets yet
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Create a ticket and our team will get back to you.
                    </p>
                    <Button
                      className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => navigate("/help/create")}
                    >
                      Create
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => navigate(`/help/${ticket.id}`)}
                        className="w-full grid grid-cols-[1.3fr_1.6fr_0.8fr_0.8fr_1.2fr_40px] gap-2 px-5 py-4 items-center text-left hover:bg-slate-50/80"
                      >
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {ticket.ref}
                        </p>
                        <div className="min-w-0">
                          <span className="inline-flex max-w-full rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-700 truncate">
                            {ticket.subject}
                          </span>
                        </div>
                        <div>
                          <PriorityBadge priority={String(ticket.priority)} />
                        </div>
                        <div>
                          <StatusBadge status={String(ticket.status)} />
                        </div>
                        <p className="text-sm text-slate-600">
                          {formatTicketDateTime(ticket.updatedAt)}
                        </p>
                        <div className="flex justify-end text-slate-400">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
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

function TicketCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategoryKey | "">("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!subject.trim()) {
      toast({
        title: "Validation",
        description: "Subject is required",
        variant: "destructive",
      });
      return;
    }
    if (!category) {
      toast({
        title: "Validation",
        description: "Select a category",
        variant: "destructive",
      });
      return;
    }
    if (!description.trim()) {
      toast({
        title: "Validation",
        description: "Description is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const json = await apiFetch(`/user/support/create`, {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          category,
        }),
      });
      const ticket = json.data as SupportTicket;
      toast({
        title: "Ticket created",
        description: ticket.ref,
      });
      navigate(`/help/${ticket.id}`);
    } catch (error) {
      toast({
        title: "Create failed",
        description:
          error instanceof Error ? error.message : "Unable to create ticket",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header title="Create Ticket" subtitle="Describe your issue" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Create Ticket</h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Have an issue? Describe it in detail below
              </p>
            </div>
            <Button
              variant="outline"
              className="border-slate-200"
              onClick={() => navigate("/help")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of the issue"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={category || undefined}
                  onValueChange={(value: TicketCategoryKey) =>
                    setCategory(value)
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
                className="resize-none"
                placeholder="Share steps to reproduce, error messages, and any useful context..."
              />
            </div>

            <div className="flex justify-end">
              <Button
                className="bg-slate-900 hover:bg-slate-800 text-white min-w-32"
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Ticket"
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const json = await apiFetch(`/user/support/detail/${id}`);
        if (!cancelled) setTicket(json.data || null);
      } catch (error) {
        if (!cancelled) {
          setTicket(null);
          toast({
            title: "Unable to load ticket",
            description:
              error instanceof Error ? error.message : "Please try again",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading ticket...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col h-full min-h-0 w-full">
        <Header title="Support Ticket" subtitle="Ticket not found" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto rounded-xl border border-slate-200 bg-white p-10 text-center space-y-4">
            <p className="text-base font-semibold text-slate-800">
              Ticket not found
            </p>
            <Button onClick={() => navigate("/help")}>Back to tickets</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <Header title="Support Ticket" subtitle={ticket.ref} />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Ticket Ref: {ticket.ref}
              </h1>
            </div>
            <Button
              variant="outline"
              className="border-slate-200"
              onClick={() => navigate("/help")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 items-start">
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900">
                Subject: {ticket.subject}
              </h2>
              <div className="rounded-lg bg-slate-100 px-4 py-4 text-sm text-slate-700 whitespace-pre-wrap break-words min-h-[120px]">
                {ticket.description || "—"}
              </div>
            </div>

            <aside className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <MetaRow label="Category" value={ticket.category} />
              <MetaRow
                label="Status"
                value={<StatusBadge status={String(ticket.status)} />}
              />
              <MetaRow
                label="Priority"
                value={<PriorityBadge priority={String(ticket.priority)} />}
              />
              <MetaRow
                label="Date Created"
                value={formatTicketPretty(ticket.createdAt)}
              />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
        {value}
      </div>
    </div>
  );
}

export default function Help() {
  return <TicketList />;
}

export function HelpCreate() {
  return <TicketCreate />;
}

export function HelpDetail() {
  return <TicketDetail />;
}
