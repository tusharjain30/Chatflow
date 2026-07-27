const express = require("express");
const router = express.Router();

const adminAuth = require("../../../middleware/adminAuth");
const validator = require("../../../middleware/validator");

const { updateAdminSchema } = require("../../../schema/super-admin/profile/update.schema");

const getProfileRoute = require("./read");
const updateProfileRoute = require("./update");

router.use("/get", adminAuth, getProfileRoute);
router.use("/update", adminAuth, validator(updateAdminSchema, "body"), updateProfileRoute);

module.exports = router;
