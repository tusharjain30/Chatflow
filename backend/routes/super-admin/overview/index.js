const express = require("express");
const adminAuth = require("../../../middleware/adminAuth");

const analyticsRoute = require("./analytics");
const healthRoute = require("./health");
const dashboardRoute = require("./dashboard");

const router = express.Router();

router.use("/dashboard", adminAuth, dashboardRoute);
router.use("/analytics", adminAuth, analyticsRoute);
router.use("/health", adminAuth, healthRoute);

module.exports = router;
