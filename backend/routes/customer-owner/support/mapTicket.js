const CATEGORY_LABELS = {
  WHATSAPP_ISSUE: "Whatsapp Issue",
  BILLING: "Billing",
  ACCOUNT_ACCESS: "Account Access",
  CAMPAIGNS: "Campaigns",
  OTHER: "Other",
};

const PRIORITY_LABELS = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  NOT_SET: "not_set",
};

const STATUS_LABELS = {
  OPEN: "Open",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

function mapTicket(ticket) {
  return {
    id: ticket.id,
    ref: ticket.ref,
    subject: ticket.subject,
    description: ticket.description,
    category: CATEGORY_LABELS[ticket.category] || ticket.category,
    categoryKey: ticket.category,
    priority: PRIORITY_LABELS[ticket.priority] || "not_set",
    priorityKey: ticket.priority,
    status: STATUS_LABELS[ticket.status] || ticket.status,
    statusKey: ticket.status,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

function buildTicketRef(seq, date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `SUP-${String(seq).padStart(6, "0")}-${yy}${mm}${dd}`;
}

module.exports = {
  mapTicket,
  buildTicketRef,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
};
