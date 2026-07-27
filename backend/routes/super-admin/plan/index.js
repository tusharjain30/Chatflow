const express = require("express");

const adminAuth = require("../../../middleware/adminAuth");
const validator = require("../../../middleware/validator");

const { createPlanSchema } = require("../../../schema/super-admin/plan/create.schema");
const { planListQuerySchema } = require("../../../schema/super-admin/plan/list.schema");
const { updatePlanSchema } = require("../../../schema/super-admin/plan/update.schema");
const { updatePlanStatusSchema } = require("../../../schema/super-admin/plan/updateStatus.schema");

const createRoute = require("./create");
const listRoute = require("./list");
const updateRoute = require("./update");
const updateStatusRoute = require("./updateStatus");

const router = express.Router();

router.use("/create", adminAuth, validator(createPlanSchema, "body"), createRoute);
router.use("/list", adminAuth, validator(planListQuerySchema, "query"), listRoute);
router.use("/update", adminAuth, validator(updatePlanSchema, "body"), updateRoute);
router.use(
  "/status",
  adminAuth,
  validator(updatePlanStatusSchema, "body"),
  updateStatusRoute,
);

module.exports = router;
