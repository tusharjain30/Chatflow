const TEAM_INVITE_DEFINITIONS = [
  {
    email: "team-admin@chatflow-demo.com",
    roleType: "CUSTOMER_ADMIN",
    expiresInHours: 48,
  },
  {
    email: "team-agent@chatflow-demo.com",
    roleType: "CUSTOMER_AGENT",
    expiresInHours: 48,
  },
];

const CUSTOMER_TEAM_MEMBERS = [
  {
    phone: "919810000006",
    firstName: "Anita",
    lastName: "Desai",
    email: "anita.desai@chatflow-demo.com",
    userName: "anita_admin_demo",
    password: "Team@123",
    roleType: "CUSTOMER_ADMIN",
    isActive: true,
  },
  {
    phone: "919810000007",
    firstName: "Rohit",
    lastName: "Verma",
    email: "rohit.verma@chatflow-demo.com",
    userName: "rohit_agent_demo",
    password: "Team@123",
    roleType: "CUSTOMER_AGENT",
    isActive: true,
  },
];

const RESELLER_TEAM_MEMBERS = [
  {
    firstName: "Nikhil",
    lastName: "Raj",
    email: "nikhil.raj@chatflow-demo.com",
    phone: "919899887700",
    password: "Team@123",
    roleType: "RESELLER_SUPPORT",
  },
  {
    firstName: "Meera",
    lastName: "Shah",
    email: "meera.shah@chatflow-demo.com",
    phone: "919899887701",
    password: "Team@123",
    roleType: "RESELLER_SUB_ADMIN",
  },
];

const INTERNAL_ADMINS = [
  {
    firstName: "Asha",
    lastName: "Menon",
    email: "ops.admin@chatflow-demo.com",
    phone: "919811110001",
    userName: "chatflow_ops_admin",
    password: "Admin@123",
  },
];

module.exports = {
  TEAM_INVITE_DEFINITIONS,
  CUSTOMER_TEAM_MEMBERS,
  RESELLER_TEAM_MEMBERS,
  INTERNAL_ADMINS,
};
