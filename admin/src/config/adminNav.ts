import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BarChart3,
  ShieldCheck,
  Building2,
  Users,
  UserCog,
  Shield,
  MessageCircle,
  Phone,
  Webhook,
  FileText,
  Send,
  Megaphone,
  Layers3,
  CreditCard,
  Receipt,
  Gauge,
  Ticket,
  Workflow,
  ListChecks,
  Database,
  Server,
  Bell,
  ScrollText,
  Settings,
  Plug,
  KeyRound,
  Mail,
  HardDrive,
  Headphones,
  BookOpen,
  MessageSquareWarning,
  History,
  Lock,
  FileLock2,
} from "lucide-react";

export type AdminNavItem = {
  icon: LucideIcon;
  label: string;
  to: string;
  end?: boolean;
};

export type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavSections: AdminNavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/admin", end: true },
      {
        icon: BarChart3,
        label: "Analytics & Reports",
        to: "/admin/analytics",
      },
      {
        icon: ShieldCheck,
        label: "Platform Health",
        to: "/admin/health",
      },
    ],
  },
  {
    label: "CUSTOMER MANAGEMENT",
    items: [
      {
        icon: Building2,
        label: "Tenants / Organizations",
        to: "/admin/tenants",
      },
      { icon: Users, label: "All Users", to: "/admin/users" },
      {
        icon: UserCog,
        label: "Team & Access Management",
        to: "/admin/team-access",
      },
      {
        icon: Shield,
        label: "Roles & Permissions",
        to: "/admin/roles-permissions",
      },
    ],
  },
  {
    label: "WHATSAPP MANAGEMENT",
    items: [
      {
        icon: MessageCircle,
        label: "WhatsApp Accounts",
        to: "/admin/whatsapp-accounts",
      },
      { icon: Phone, label: "Phone Numbers", to: "/admin/phone-numbers" },
      { icon: Webhook, label: "Webhooks", to: "/admin/webhooks" },
      {
        icon: FileText,
        label: "Message Templates",
        to: "/admin/message-templates",
      },
      { icon: Send, label: "Message Logs", to: "/admin/message-logs" },
      {
        icon: Megaphone,
        label: "Campaign Monitoring",
        to: "/admin/campaign-monitoring",
      },
    ],
  },
  {
    label: "SAAS & REVENUE",
    items: [
      {
        icon: Layers3,
        label: "Subscription Plans",
        to: "/admin/plans",
      },
      {
        icon: CreditCard,
        label: "Subscriptions",
        to: "/admin/subscriptions",
      },
      {
        icon: Receipt,
        label: "Invoices & Payments",
        to: "/admin/payments",
      },
      { icon: Gauge, label: "Usage & Quotas", to: "/admin/usage-quotas" },
      {
        icon: Ticket,
        label: "Coupons & Discounts",
        to: "/admin/coupons",
      },
    ],
  },
  {
    label: "PLATFORM OPERATIONS",
    items: [
      {
        icon: Workflow,
        label: "Automation Monitoring",
        to: "/admin/automation-monitoring",
      },
      {
        icon: ListChecks,
        label: "Background Jobs / Queues",
        to: "/admin/jobs-queues",
      },
      {
        icon: Database,
        label: "Database Monitoring",
        to: "/admin/database-monitoring",
      },
      {
        icon: Server,
        label: "Redis Monitoring",
        to: "/admin/redis-monitoring",
      },
      { icon: Bell, label: "Notifications", to: "/admin/notifications" },
      { icon: ScrollText, label: "Audit Logs", to: "/admin/audit-logs" },
    ],
  },
  {
    label: "CONFIGURATION",
    items: [
      {
        icon: Settings,
        label: "General Settings",
        to: "/admin/settings",
      },
      { icon: Plug, label: "Integrations", to: "/admin/integrations" },
      { icon: KeyRound, label: "API Management", to: "/admin/api-management" },
      {
        icon: Mail,
        label: "Email Configuration",
        to: "/admin/email-configuration",
      },
      {
        icon: HardDrive,
        label: "Storage Management",
        to: "/admin/storage",
      },
    ],
  },
  {
    label: "CUSTOMER SUCCESS",
    items: [
      {
        icon: Headphones,
        label: "Support Tickets",
        to: "/admin/support-tickets",
      },
      { icon: BookOpen, label: "Help Center", to: "/admin/help-center" },
      {
        icon: Megaphone,
        label: "Announcements",
        to: "/admin/announcements",
      },
      {
        icon: MessageSquareWarning,
        label: "Feedback & Complaints",
        to: "/admin/feedback",
      },
    ],
  },
  {
    label: "SECURITY",
    items: [
      {
        icon: ShieldCheck,
        label: "Security Center",
        to: "/admin/security-center",
      },
      { icon: History, label: "Login History", to: "/admin/login-history" },
      {
        icon: Lock,
        label: "Session Management",
        to: "/admin/session-management",
      },
      {
        icon: FileLock2,
        label: "Data & Privacy",
        to: "/admin/data-privacy",
      },
    ],
  },
];

/** Modules that still need full implementation (placeholder shell). */
export const comingSoonModules: Array<{
  path: string;
  title: string;
  subtitle: string;
}> = [
  {
    path: "team-access",
    title: "Team & Access Management",
    subtitle: "Manage internal admin users and access assignments",
  },
  {
    path: "roles-permissions",
    title: "Roles & Permissions",
    subtitle: "Define platform roles and permission matrices",
  },
  {
    path: "whatsapp-accounts",
    title: "WhatsApp Accounts",
    subtitle: "Monitor connected WABA accounts across tenants",
  },
  {
    path: "phone-numbers",
    title: "Phone Numbers",
    subtitle: "Inventory and status of WhatsApp phone numbers",
  },
  {
    path: "webhooks",
    title: "Webhooks",
    subtitle: "Webhook endpoints, delivery health, and retries",
  },
  {
    path: "message-templates",
    title: "Message Templates",
    subtitle: "Review and moderate templates across organizations",
  },
  {
    path: "campaign-monitoring",
    title: "Campaign Monitoring",
    subtitle: "Track campaign throughput, failures, and queues",
  },
  {
    path: "subscriptions",
    title: "Subscriptions",
    subtitle: "Active, trial, and cancelled customer subscriptions",
  },
  {
    path: "usage-quotas",
    title: "Usage & Quotas",
    subtitle: "Message, template, and seat usage against plan limits",
  },
  {
    path: "coupons",
    title: "Coupons & Discounts",
    subtitle: "Create and manage promotional pricing codes",
  },
  {
    path: "automation-monitoring",
    title: "Automation Monitoring",
    subtitle: "Bot flows, trigger health, and failure rates",
  },
  {
    path: "jobs-queues",
    title: "Background Jobs / Queues",
    subtitle: "BullMQ job queues, retries, and worker health",
  },
  {
    path: "database-monitoring",
    title: "Database Monitoring",
    subtitle: "Connection health, latency, and storage signals",
  },
  {
    path: "redis-monitoring",
    title: "Redis Monitoring",
    subtitle: "Cache and queue broker availability",
  },
  {
    path: "notifications",
    title: "Notifications",
    subtitle: "Platform alerts and admin notification channels",
  },
  {
    path: "audit-logs",
    title: "Audit Logs",
    subtitle: "Immutable trail of privileged admin actions",
  },
  {
    path: "integrations",
    title: "Integrations",
    subtitle: "Third-party connectors and platform integrations",
  },
  {
    path: "api-management",
    title: "API Management",
    subtitle: "API keys, rate limits, and service tokens",
  },
  {
    path: "email-configuration",
    title: "Email Configuration",
    subtitle: "SMTP providers and transactional email settings",
  },
  {
    path: "storage",
    title: "Storage Management",
    subtitle: "Media uploads, retention, and storage backends",
  },
  {
    path: "support-tickets",
    title: "Support Tickets",
    subtitle: "Customer support queue and SLA tracking",
  },
  {
    path: "help-center",
    title: "Help Center",
    subtitle: "Knowledge base articles and help content",
  },
  {
    path: "announcements",
    title: "Announcements",
    subtitle: "Broadcast product updates to customers",
  },
  {
    path: "feedback",
    title: "Feedback & Complaints",
    subtitle: "Collect and triage customer feedback",
  },
  {
    path: "security-center",
    title: "Security Center",
    subtitle: "Security posture, alerts, and policy controls",
  },
  {
    path: "login-history",
    title: "Login History",
    subtitle: "Recent admin and user authentication events",
  },
  {
    path: "session-management",
    title: "Session Management",
    subtitle: "Active sessions and forced logout controls",
  },
  {
    path: "data-privacy",
    title: "Data & Privacy",
    subtitle: "Retention, export, and privacy compliance tools",
  },
];
