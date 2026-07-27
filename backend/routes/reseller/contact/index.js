const express = require("express");

const requireAuth = require("../../../middleware/requireAuth");
const validator = require("../../../middleware/validator");
const { resellerContactsQuerySchema } = require("../../../schema/reseller/contact/list.schema");

const listRoute = require("./list");

const router = express.Router();

router.use("/", requireAuth, validator(resellerContactsQuerySchema, "query"), listRoute);

module.exports = router;
