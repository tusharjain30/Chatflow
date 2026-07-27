const express = require("express");
const router = express.Router();

const validator = require("../../../middleware/validator");
const requireAuth = require("../../../middleware/requireAuth");

const { userRegisterSchema } = require("../../../schema/customer-owner/auth/register.schema");
const { userLoginSchema } = require("../../../schema/customer-owner/auth/login.schema");
const { verifyUserOtpSchema } = require("../../../schema/customer-owner/auth/verifyOtp.schema");
const { changePasswordSchema } = require("../../../schema/customer-owner/auth/changePassword.schema");

const registerRoute = require("./register");
const loginRoute = require("./login");
const verifyOtpRoute = require("./verifyOtp");
const changePasswordRoute = require("./changePassword");

router.use("/register", validator(userRegisterSchema, "body"), registerRoute);
router.use("/login", validator(userLoginSchema, "body"), loginRoute);
router.use("/changePassword", requireAuth, validator(changePasswordSchema, "body"), changePasswordRoute);
router.use("/verify-otp", validator(verifyUserOtpSchema, "body"), verifyOtpRoute);

module.exports = router;
