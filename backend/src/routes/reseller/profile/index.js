const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");
const validator = require("../../../middleware/validator");
const { updateResellerProfileSchema } = require("../../../schema/reseller/profile/update.schema");

const meRoute = require("./me");
const updateRoute = require("./update");

router.use("/me", requireAuth, meRoute);
router.use("/update", requireAuth, validator(updateResellerProfileSchema, "body"), updateRoute);

module.exports = router;
