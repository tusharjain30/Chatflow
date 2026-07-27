const express = require("express");
const router = express.Router();

const validator = require("../../../middleware/validator");
const adminAuth = require("../../../middleware/adminAuth");

const registerRoute = require("./register");
const loginRoute = require("./login");
const logoutAllRoute = require("./logoutAllDevices");
const changePasswordRoute = require("./changePassword");

const { superAdminRegisterSchema } = require("../../../schema/super-admin/auth/register.schema");
const { superAdminLoginSchema } = require("../../../schema/super-admin/auth/login.schema");
const { changePasswordSchema } = require("../../../schema/super-admin/auth/changePassword.schema");

router.use("/register", validator(superAdminRegisterSchema, "body"), registerRoute);
router.use("/login", validator(superAdminLoginSchema, "body"), loginRoute);
router.use("/change-password", adminAuth, validator(changePasswordSchema, "body"), changePasswordRoute);
router.use("/logout-all", logoutAllRoute);

module.exports = router;