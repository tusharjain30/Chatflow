const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const profileRoutes = require("./profile");
const dashboardRoutes = require("./dashboard");
const customerRoutes = require("./customer");
const plansRoutes = require("./plans");
const earningsRoutes = require("./earnings");
const billingRoutes = require("./billing");
const auditRoutes = require("./audit");
const teamRoutes = require("./team");
const campaignRoutes = require("./campaign");
const templateRoutes = require("./template");
const contactRoutes = require("./contact");
const contactGroupRoutes = require("./contact-group");

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/customers", customerRoutes);
router.use("/plans", plansRoutes);
router.use("/earnings", earningsRoutes);
router.use("/billing", billingRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/templates", templateRoutes);
router.use("/contacts", contactRoutes);
router.use("/contact-groups", contactGroupRoutes);
router.use("/audit", auditRoutes);
router.use("/team", teamRoutes);

module.exports = router;
