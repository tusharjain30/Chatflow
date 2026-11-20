const express = require("express");
const router = express.Router();
const authRoutes = require("./auth/index");
const whatsappRoutes = require("./whatsapp");
const customerRoutes = require("./customer");
const contactRoutes = require("./contacts");
const dashboardRoutes = require("./dashboard");
const profileRoutes = require("./profile");
const teamRoutes = require("./team");
const accountRoutes = require("./account");
const campaignRoutes = require("./campaign");
const supportRoutes = require("./support");
const developerRoutes = require("./developer");

router.use("/auth", authRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/customer", customerRoutes);
router.use("/contacts", contactRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/profile", profileRoutes);
router.use("/team", teamRoutes);
router.use("/account", accountRoutes);
router.use("/campaign", campaignRoutes);
router.use("/support", supportRoutes);
router.use("/developer", developerRoutes);

module.exports = router;
