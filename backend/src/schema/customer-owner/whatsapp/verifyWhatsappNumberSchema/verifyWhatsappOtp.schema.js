const { z } = require("zod");

const verifyWhatsappOtpSchema = z.object({
    otp: z
        .string({
            required_error: "Otp is required",
            invalid_type_error: "otp must be a string"
        })
        .min(6, "Invalid OTP")
        .max(6, "Invalid OTP")
});

module.exports = {verifyWhatsappOtpSchema};