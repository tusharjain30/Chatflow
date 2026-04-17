const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const profileRoutes = require("./profile");
const dashboardRoutes = require("./dashboard");
const customerRoutes = require("./customer");
const plansRoutes = require("./plans");
const earningsRoutes = require("./earnings");
const billingRoutes = require("./billing");

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/customers", customerRoutes);
router.use("/plans", plansRoutes);
router.use("/earnings", earningsRoutes);
router.use("/billing", billingRoutes);

module.exports = router;
