export type TicketPriority = "critical" | "high" | "medium" | "low" | "not_set";
export type TicketStatus = "Open" | "Resolved" | "Closed";
export type TicketCategory =
  | "Whatsapp Issue"
  | "Billing"
  | "Account Access"
  | "Campaigns"
  | "Other";

export type TicketCategoryKey =
  | "WHATSAPP_ISSUE"
  | "BILLING"
  | "ACCOUNT_ACCESS"
  | "CAMPAIGNS"
  | "OTHER";

export type SupportTicket = {
  id: string;
  ref: string;
  subject: string;
  description: string;
  category: TicketCategory | string;
  categoryKey?: TicketCategoryKey;
  priority: TicketPriority | string;
  priorityKey?: string;
  status: TicketStatus | string;
  statusKey?: string;
  createdAt: string;
  updatedAt: string;
};

export const CATEGORY_OPTIONS: Array<{
  value: TicketCategoryKey;
  label: TicketCategory;
}> = [
  { value: "WHATSAPP_ISSUE", label: "Whatsapp Issue" },
  { value: "BILLING", label: "Billing" },
  { value: "ACCOUNT_ACCESS", label: "Account Access" },
  { value: "CAMPAIGNS", label: "Campaigns" },
  { value: "OTHER", label: "Other" },
];

export function formatTicketDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export function formatTicketPretty(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function priorityLabel(priority: string) {
  if (priority === "not_set" || priority === "NOT_SET") return "Not Set";
  return String(priority).toLowerCase();
}
