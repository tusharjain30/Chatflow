const express = require("express");
const router = express.Router();

const validator = require("../../../middleware/validator");
const requireAuth = require("../../../middleware/requireAuth");

const { userRegisterSchema } = require("../../../schema/customer-owner/auth/register.schema");
const { userLoginSchema } = require("../../../schema/customer-owner/auth/login.schema");
const { verifyUserOtpSchema } = require("../../../schema/customer-owner/auth/verifyOtp.schema");
const { changePasswordSchema } = require("../../../schema/customer-owner/auth/changePassword.schema");
const { forgotPasswordSchema } = require("../../../schema/customer-owner/auth/forgotPassword.schema");
const { resetPasswordSchema } = require("../../../schema/customer-owner/auth/resetPassword.schema");

const registerRoute = require("./register");
const loginRoute = require("./login");
const verifyOtpRoute = require("./verifyOtp");
const changePasswordRoute = require("./changePassword");
const forgotPasswordRoute = require("./forgotPassword");
const resetPasswordRoute = require("./resetPassword");

router.use("/register", validator(userRegisterSchema, "body"), registerRoute);
router.use("/login", validator(userLoginSchema, "body"), loginRoute);
router.use("/changePassword", requireAuth, validator(changePasswordSchema, "body"), changePasswordRoute);
router.use("/verify-otp", validator(verifyUserOtpSchema, "body"), verifyOtpRoute);
router.use("/forgot-password", validator(forgotPasswordSchema, "body"), forgotPasswordRoute);
router.use("/reset-password", validator(resetPasswordSchema, "body"), resetPasswordRoute);

module.exports = router;
