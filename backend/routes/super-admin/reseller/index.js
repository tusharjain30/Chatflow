const express = require("express");

const adminAuth = require("../../../middleware/adminAuth");
const validator = require("../../../middleware/validator");

const { createResellerSchema } = require("../../../schema/super-admin/reseller/create.schema");
const { resellerListQuerySchema } = require("../../../schema/super-admin/reseller/list.schema");
const { resellerStatsQuerySchema } = require("../../../schema/super-admin/reseller/stats.schema");
const { updateResellerCommissionSchema } = require("../../../schema/super-admin/reseller/updateCommission.schema");
const { updateResellerStatusSchema } = require("../../../schema/super-admin/reseller/updateStatus.schema");

const createRoute = require("./create");
const listRoute = require("./list");
const statsRoute = require("./stats");
const updateCommissionRoute = require("./updateCommission");
const updateStatusRoute = require("./updateStatus");

const router = express.Router();

router.use("/create", adminAuth, validator(createResellerSchema, "body"), createRoute);
router.use("/list", adminAuth, validator(resellerListQuerySchema, "query"), listRoute);
router.use("/stats", adminAuth, validator(resellerStatsQuerySchema, "query"), statsRoute);
router.use(
  "/commission",
  adminAuth,
  validator(updateResellerCommissionSchema, "body"),
  updateCommissionRoute,
);
router.use(
  "/status",
  adminAuth,
  validator(updateResellerStatusSchema, "body"),
  updateStatusRoute,
);

module.exports = router;
