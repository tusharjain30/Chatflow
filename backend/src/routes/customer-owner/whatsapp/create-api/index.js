const express = require("express");
const router = express.Router();
const requireAuth = require("../../../../middleware/requireAuth");

const createApiRoute = require("./createApi");

router.use("/api", requireAuth, createApiRoute);

module.exports = router;