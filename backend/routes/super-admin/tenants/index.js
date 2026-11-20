const express = require("express");
const adminAuth = require("../../../middleware/adminAuth");
const validator = require("../../../middleware/validator");

const { tenantListQuerySchema } = require("../../../schema/super-admin/tenants/list.schema");
const { tenantCreateSchema } = require("../../../schema/super-admin/tenants/create.schema");
const { tenantUpdateSchema } = require("../../../schema/super-admin/tenants/update.schema");
const { tenantStatusSchema } = require("../../../schema/super-admin/tenants/status.schema");
const { tenantChangePlanSchema } = require("../../../schema/super-admin/tenants/changePlan.schema");
const { tenantExtendTrialSchema } = require("../../../schema/super-admin/tenants/extendTrial.schema");

const listRoute = require("./list");
const detailRoute = require("./detail");
const createRoute = require("./create");
const updateRoute = require("./update");
const statusRoute = require("./status");
const deleteRoute = require("./delete");
const changePlanRoute = require("./changePlan");
const extendTrialRoute = require("./extendTrial");
const resetLimitsRoute = require("./resetLimits");
const impersonateRoute = require("./impersonate");
const exportRoute = require("./export");

const router = express.Router();

router.use("/export", adminAuth, exportRoute);

router.get("/", adminAuth, validator(tenantListQuerySchema, "query"), listRoute);
router.post("/", adminAuth, validator(tenantCreateSchema, "body"), createRoute);

router.use("/:id/status", adminAuth, validator(tenantStatusSchema, "body"), statusRoute);
router.use(
  "/:id/change-plan",
  adminAuth,
  validator(tenantChangePlanSchema, "body"),
  changePlanRoute,
);
router.use(
  "/:id/extend-trial",
  adminAuth,
  validator(tenantExtendTrialSchema, "body"),
  extendTrialRoute,
);
router.use("/:id/reset-limits", adminAuth, resetLimitsRoute);
router.use("/:id/impersonate", adminAuth, impersonateRoute);

router.get("/:id", adminAuth, detailRoute);
router.patch("/:id", adminAuth, validator(tenantUpdateSchema, "body"), updateRoute);
router.delete("/:id", adminAuth, deleteRoute);

module.exports = router;
