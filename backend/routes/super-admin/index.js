const express = require("express");
const router = express.Router();
const authRoutes = require("./auth");
const invoiceRoutes = require("./invoice");
const internalAdminRoutes = require("./internal-admin");
const permissionRoutes = require("./permission");
const planRoutes = require("./plan");
const profileRoutes = require("./profile");
const resellerRoutes = require("./reseller");
const toolsRoutes = require("./tools");
const rollRoutes = require("./role");

router.use("/auth", authRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/internal-admin", internalAdminRoutes);
router.use("/permission", permissionRoutes);
router.use("/plans", planRoutes);
router.use("/profile", profileRoutes);
router.use("/resellers", resellerRoutes);
router.use("/tools", toolsRoutes);
router.use("/roles", rollRoutes);

module.exports = router;
