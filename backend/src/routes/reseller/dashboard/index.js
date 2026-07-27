const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");
const statsRoute = require("./stats");
const overviewRoute = require("./overview");

router.use("/stats", requireAuth, statsRoute);
router.use("/overview", requireAuth, overviewRoute);

module.exports = router;
