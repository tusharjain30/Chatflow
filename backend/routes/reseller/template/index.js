const express = require("express");

const requireAuth = require("../../../middleware/requireAuth");
const validator = require("../../../middleware/validator");
const { resellerTemplatesQuerySchema } = require("../../../schema/reseller/template/list.schema");

const listRoute = require("./list");

const router = express.Router();

router.use("/", requireAuth, validator(resellerTemplatesQuerySchema, "query"), listRoute);

module.exports = router;
