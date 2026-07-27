const express = require("express");
const router = express.Router();

const adminAuth = require("../../../middleware/adminAuth");
const validator = require("../../../middleware/validator");

const { createRoleSchema } = require("../../../schema/super-admin/roll/create.schema");
const { getRoleByIdSchema } = require("../../../schema/super-admin/roll/getById.schema");
const { updateRoleBodySchema } = require("../../../schema/super-admin/roll/update.schema");
const { assignRoleToAdminSchema } = require("../../../schema/super-admin/roll/assignRoleToAdmin.schema");
const { deleteRoleSchema } = require("../../../schema/super-admin/roll/delete.schema");

const createRollRoute = require("./create");
const getRollsRoute = require("./read");
const getRollByIdRoute = require("./getById");
const updateRollRoute = require("./update");
const assignRoleToAdminRoute = require("./assignRoleToAdmin");
const deleteRoleRoute = require("./delete");

router.use("/create", adminAuth, validator(createRoleSchema, "body"), createRollRoute);
router.use("/read", adminAuth, getRollsRoute);
router.use("/getById", adminAuth, validator(getRoleByIdSchema, "body"), getRollByIdRoute);
router.use("/update", adminAuth, validator(updateRoleBodySchema, "body"), updateRollRoute);
router.use("/assign", adminAuth, validator(assignRoleToAdminSchema, "body"), assignRoleToAdminRoute);
router.use("/delete", adminAuth, validator(deleteRoleSchema, "body"), deleteRoleRoute);

module.exports = router;