const CONTACT_GROUPS = [
  {
    title: "Hot Leads",
    description: "High-intent prospects ready for follow-up campaigns.",
  },
  {
    title: "Existing Customers",
    description: "Customers with successful onboarding and active engagement.",
  },
  {
    title: "Re-engagement",
    description: "Contacts who need follow-up after a period of inactivity.",
  },
];

const CUSTOM_FIELDS = [
  { name: "Lead Source", key: "lead_source", type: "text" },
  { name: "Customer Type", key: "customer_type", type: "text" },
  { name: "Budget", key: "budget", type: "number" },
  { name: "Last Follow Up", key: "last_follow_up", type: "date" },
];

const CONTACT_DEFINITIONS = [
  {
    phone: "919810000001",
    firstName: "Rahul",
    lastName: "Sharma",
    country: "India",
    languageCode: "en",
    email: "rahul.sharma@example.com",
    isOptedOut: false,
    groups: ["Hot Leads"],
    customFields: {
      lead_source: "Website Form",
      customer_type: "Prospect",
      budget: "150000",
      last_follow_up: "2026-03-28",
    },
  },
  {
    phone: "919810000002",
    firstName: "Priya",
    lastName: "Mehta",
    country: "India",
    languageCode: "en",
    email: "priya.mehta@example.com",
    isOptedOut: false,
    groups: ["Existing Customers"],
    customFields: {
      lead_source: "Referral",
      customer_type: "Customer",
      budget: "85000",
      last_follow_up: "2026-03-30",
    },
  },
  {
    phone: "919810000003",
    firstName: "Aman",
    lastName: "Khan",
    country: "India",
    languageCode: "hi",
    email: "aman.khan@example.com",
    isOptedOut: false,
    groups: ["Re-engagement"],
    customFields: {
      lead_source: "Instagram",
      customer_type: "Dormant",
      budget: "60000",
      last_follow_up: "2026-03-10",
    },
  },
  {
    phone: "919810000004",
    firstName: "Sneha",
    lastName: "Patel",
    country: "India",
    languageCode: "en",
    email: "sneha.patel@example.com",
    isOptedOut: false,
    groups: ["Hot Leads", "Existing Customers"],
    customFields: {
      lead_source: "Sales Call",
      customer_type: "Upsell",
      budget: "225000",
      last_follow_up: "2026-04-01",
    },
  },
  {
    phone: "919810000005",
    firstName: "Vikram",
    lastName: "Joshi",
    country: "India",
    languageCode: "hi",
    email: "vikram.joshi@example.com",
    isOptedOut: true,
    groups: ["Re-engagement"],
    customFields: {
      lead_source: "Old Database",
      customer_type: "Opted Out",
      budget: "40000",
      last_follow_up: "2026-02-14",
    },
  },
];

module.exports = {
  CONTACT_GROUPS,
  CUSTOM_FIELDS,
  CONTACT_DEFINITIONS,
};
