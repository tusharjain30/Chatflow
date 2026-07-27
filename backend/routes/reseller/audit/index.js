const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const requireAuth = require("../../../middleware/requireAuth");
const { PrismaClient } = require("../../../generated/prisma/client");

const userActivityRouter = require("./userActivity");
const planHistoryRouter = require("./planHistory");
const billingHistoryRouter = require("./billingHistory");

const prisma = new PrismaClient();
const router = express.Router();

router.use("/users", userActivityRouter);
router.use("/plans", planHistoryRouter);
router.use("/billing", billingHistoryRouter);

module.exports = router;
