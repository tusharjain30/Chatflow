const accounts = require("./accounts");
const { PERMISSION_NAMES } = require("./permissions");
const { PLAN_DEFINITIONS } = require("./plans");
const {
  CONTACT_GROUPS,
  CUSTOM_FIELDS,
  CONTACT_DEFINITIONS,
} = require("./contacts");
const { TEMPLATE_DEFINITIONS } = require("./templates");
const {
  TEAM_INVITE_DEFINITIONS,
  CUSTOMER_TEAM_MEMBERS,
  RESELLER_TEAM_MEMBERS,
  INTERNAL_ADMINS,
} = require("./teams");
const { RESELLER_CUSTOMER_DEFINITIONS } = require("./resellerCustomers");
const { BOT_DEFINITIONS } = require("./bots");
const { CAMPAIGN_DEFINITIONS } = require("./campaigns");
const { BILLING_TRANSACTIONS } = require("./billing");
const {
  WHATSAPP_ACCOUNT,
  WABA_VERIFICATION,
  WEBHOOK_EVENTS,
} = require("./whatsapp");
const { ACCESS_TOKEN_DEFINITIONS } = require("./accessTokens");
const { MESSAGE_LOG_DEFINITIONS } = require("./messageLogs");

module.exports = {
  ...accounts,
  PERMISSION_NAMES,
  PLAN_DEFINITIONS,
  CONTACT_GROUPS,
  CUSTOM_FIELDS,
  CONTACT_DEFINITIONS,
  TEMPLATE_DEFINITIONS,
  TEAM_INVITE_DEFINITIONS,
  CUSTOMER_TEAM_MEMBERS,
  RESELLER_TEAM_MEMBERS,
  INTERNAL_ADMINS,
  RESELLER_CUSTOMER_DEFINITIONS,
  BOT_DEFINITIONS,
  CAMPAIGN_DEFINITIONS,
  BILLING_TRANSACTIONS,
  WHATSAPP_ACCOUNT,
  WABA_VERIFICATION,
  WEBHOOK_EVENTS,
  ACCESS_TOKEN_DEFINITIONS,
  MESSAGE_LOG_DEFINITIONS,
};
