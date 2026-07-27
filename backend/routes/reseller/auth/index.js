const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");
const validator = require("../../../middleware/validator");
const { resellerLoginSchema } = require("../../../schema/reseller/auth/login.schema");
const { resellerChangePasswordSchema } = require("../../../schema/reseller/auth/changePassword.schema");

const loginRoute = require("./login");
const changePasswordRoute = require("./changePassword");

router.use("/login", validator(resellerLoginSchema, "body"), loginRoute);
router.use(
  "/change-password",
  requireAuth,
  validator(resellerChangePasswordSchema, "body"),
  changePasswordRoute,
);

module.exports = router;
