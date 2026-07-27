const { z } = require("zod");

const verifyUserOtpSchema = z.object({
  email: z
    .string({required_error: "Email is required"})
    .email("Invalid email"),

  otp: z
    .string({required_error: "Otp is required"})
    .min(4, "OTP must be at least 4 digits")
    .max(6, "OTP must be at most 6 digits"),

  rememberMe: z
    .boolean()
    .optional()
});

module.exports = {verifyUserOtpSchema};