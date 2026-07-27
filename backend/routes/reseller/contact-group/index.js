const express = require("express");

const requireAuth = require("../../../middleware/requireAuth");
const validator = require("../../../middleware/validator");
const { resellerContactGroupsQuerySchema } = require("../../../schema/reseller/contact-group/list.schema");

const listRoute = require("./list");

const router = express.Router();

router.use("/", requireAuth, validator(resellerContactGroupsQuerySchema, "query"), listRoute);

module.exports = router;
