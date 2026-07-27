const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");
const validator = require("../../../middleware/validator");

const { updateProfileSchema } = require("../../../schema/customer-owner/profile/update.schema");

const profileRoute = require("./me");
const updateprofileRoute = require("./update");

router.use("/me", requireAuth, profileRoute);
router.use("/update", requireAuth, validator(updateProfileSchema, "body"), updateprofileRoute);

module.exports = router;
