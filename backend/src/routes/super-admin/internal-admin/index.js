const express = require("express");
const router = express.Router();

const { adminCreateSchema } = require("../../../schema/super-admin/internal-admin/create.schema");
const { adminListQuerySchema } = require("../../../schema/super-admin/internal-admin/read.schema");
const { updateAdminSchema } = require("../../../schema/super-admin/internal-admin/update.schema");
const { softDeleteAdminSchema } = require("../../../schema/super-admin/internal-admin/delete.schema");
const { detailAdminSchema } = require("../../../schema/super-admin/internal-admin/detail.schema");
const { updateStatusSchema } = require("../../../schema/super-admin/internal-admin/updateStatus.schema");
const { forceLogoutSchema } = require("../../../schema/super-admin/internal-admin/forceLogout.schema");

const validator = require("../../../middleware/validator");
const adminAuth = require("../../../middleware/adminAuth");

const createAdminRoute = require("./createAdmin");
const adminlistRoute = require("./read");
const adminUpdateRoute = require("./update");
const adminDeleteRoute = require("./delete");
const adminDetailRoute = require("./detail");
const updateStatusRoute = require("./updateStatus");
const forceLogoutRoute = require("./forceLogout");

router.use("/create-admin", adminAuth, validator(adminCreateSchema, "body"), createAdminRoute);
router.use("/read", adminAuth, validator(adminListQuerySchema, "query"), adminlistRoute);
router.use("/update", adminAuth, validator(updateAdminSchema, "body"), adminUpdateRoute);
router.use("/delete", adminAuth, validator(softDeleteAdminSchema, "body"), adminDeleteRoute);
router.use("/:adminId", adminAuth, validator(detailAdminSchema, "params"), adminDetailRoute);
router.use("/status", adminAuth, validator(updateStatusSchema, "body"), updateStatusRoute);
router.use("/force-logout", adminAuth, validator(forceLogoutSchema, "body"), forceLogoutRoute);

module.exports = router;