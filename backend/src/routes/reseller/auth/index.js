const express = require("express");
const router = express.Router();

const validator = require("../../../middleware/validator");
const { resellerLoginSchema } = require("../../../schema/reseller/auth/login.schema");

const loginRoute = require("./login");

router.use("/login", validator(resellerLoginSchema, "body"), loginRoute);

module.exports = router;
