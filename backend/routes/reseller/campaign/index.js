const express = require("express");

const requireAuth = require("../../../middleware/requireAuth");
const validator = require("../../../middleware/validator");
const { resellerCampaignsQuerySchema } = require("../../../schema/reseller/campaign/list.schema");
const { resellerCampaignDetailSchema } = require("../../../schema/reseller/campaign/detail.schema");

const listRoute = require("./list");
const detailRoute = require("./detail");

const router = express.Router();

router.use("/", requireAuth, validator(resellerCampaignsQuerySchema, "query"), listRoute);
router.use("/detail", requireAuth, validator(resellerCampaignDetailSchema, "query"), detailRoute);

module.exports = router;
