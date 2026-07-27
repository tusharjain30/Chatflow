const express = require("express");
const router = express.Router();

const requireAuth = require("../../../../middleware/requireAuth");
const validator = require("../../../../middleware/validator");
const { submitWhatsappNumberSchema } = require("../../../../schema/customer-owner/whatsapp/verifyWhatsappNumberSchema/submitNumber.schema");
const { verifyWhatsappOtpSchema } = require("../../../../schema/customer-owner/whatsapp/verifyWhatsappNumberSchema/verifyWhatsappOtp.schema");

const submitNumberRoute = require("./submitNumber");
const verifyWhatsappOtpRoute = require("./verifyWhatsappOtp");

router.use("/submit-whatsapp-number", requireAuth, validator(submitWhatsappNumberSchema, "body"), submitNumberRoute);
router.use("/verify-otp", requireAuth, validator(verifyWhatsappOtpSchema, "body"), verifyWhatsappOtpRoute);

module.exports = router;
