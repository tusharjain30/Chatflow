const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");
const validator = require("../../../middleware/validator");
const { resellerTeamListSchema } = require("../../../schema/reseller/team/list.schema");
const { resellerTeamCreateSchema } = require("../../../schema/reseller/team/create.schema");
const { resellerTeamUpdateSchema } = require("../../../schema/reseller/team/update.schema");
const { resellerTeamDeleteSchema } = require("../../../schema/reseller/team/delete.schema");

const listRoute = require("./list");
const createRoute = require("./create");
const updateRoute = require("./update");
const deleteRoute = require("./delete");

router.use("/", requireAuth, validator(resellerTeamListSchema, "query"), listRoute);
router.use("/create", requireAuth, validator(resellerTeamCreateSchema, "body"), createRoute);
router.use("/update", requireAuth, validator(resellerTeamUpdateSchema, "body"), updateRoute);
router.use("/delete", requireAuth, validator(resellerTeamDeleteSchema, "body"), deleteRoute);

module.exports = router;
