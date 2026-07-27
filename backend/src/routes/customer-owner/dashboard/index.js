const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");

const userStatsRoute = require("./stats");

router.use("/stats", requireAuth, userStatsRoute);

module.exports = router;