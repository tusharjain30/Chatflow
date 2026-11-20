const express = require("express");
const router = express.Router();

const requireAuth = require("../../../../middleware/requireAuth");
const requireOwner = require("../../../../middleware/requireOwner");

const disconnectRoute = require("./disconnect");

router.use("/disconnect", requireAuth, requireOwner, disconnectRoute);

module.exports = router;
