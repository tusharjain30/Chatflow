const OWNER = {
  roleName: "CUSTOMER_OWNER",
  email: "owner@chatflow-demo.com",
  phone: "919876543210",
  userName: "chatflow_owner_demo",
  password: "Owner@123",
  firstName: "Demo",
  lastName: "Owner",
  companyName: "ChatFlow Demo Ventures",
};

const SUPER_ADMIN = {
  roleName: "SUPER_ADMIN",
  email: "superadmin@chatflow-demo.com",
  phone: "919811110000",
  userName: "chatflow_super_admin",
  password: "SuperAdmin@123",
  firstName: "Super",
  lastName: "Admin",
};

const INTERNAL_ADMIN_ROLE_NAME = "OPERATIONS_MANAGER";

const RESELLER = {
  companyName: "ChatFlow Partner Network",
  email: "reseller@chatflow-demo.com",
  phone: "919899887766",
  userName: "chatflow_reseller_demo",
  password: "Reseller@123",
  firstName: "Demo",
  lastName: "Reseller",
  commissionRate: 18,
  balance: 42500,
};

const PRIMARY_SUBSCRIPTION_START_DATE = new Date("2026-01-15T00:00:00.000Z");
const PRIMARY_PLAN_NAME = "Growth";

module.exports = {
  OWNER,
  SUPER_ADMIN,
  INTERNAL_ADMIN_ROLE_NAME,
  RESELLER,
  PRIMARY_SUBSCRIPTION_START_DATE,
  PRIMARY_PLAN_NAME,
};
