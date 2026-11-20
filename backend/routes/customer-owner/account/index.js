const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");
const requireOwner = require("../../../middleware/requireOwner");
const validator = require("../../../middleware/validator");

const { updateAccountSchema } = require("../../../schema/customer-owner/account/update.schema");

const detailRoute = require("./detail");
const updateRoute = require("./update");
const subscriptionRoute = require("./subscription");
const usageRoute = require("./usage");
const whatsappIntegrationRoute = require("./whatsappIntegration");
const plansRoute = require("./plans");
const billingHistoryRoute = require("./billingHistory");
const subscribeRoute = require("./subscribe");
const addPaymentRoute = require("./addPayment");

router.use("/detail", requireAuth, requireOwner, detailRoute);
router.use("/update", requireAuth, requireOwner, validator(updateAccountSchema, "body"), updateRoute);
router.use("/subscription", requireAuth, requireOwner, subscriptionRoute);
router.use("/usage", requireAuth, requireOwner, usageRoute);
router.use("/whatsapp-integration", requireAuth, requireOwner, whatsappIntegrationRoute);
router.use("/plans", requireAuth, requireOwner, plansRoute);
router.use("/billing-history", requireAuth, requireOwner, billingHistoryRoute);
router.use("/subscribe", requireAuth, requireOwner, subscribeRoute);
router.use("/add-payment", requireAuth, requireOwner, addPaymentRoute);

module.exports = router;

