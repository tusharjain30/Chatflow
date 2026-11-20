const { z } = require("zod");

const resetPasswordSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Invalid email"),
    otp: z
      .string({ required_error: "OTP is required" })
      .trim()
      .min(4, "OTP must be at least 4 digits")
      .max(6, "OTP must be at most 6 digits"),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, "Password must be at least 8 characters"),
    confirmNewPassword: z
      .string({ required_error: "Confirm password is required" })
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmNewPassword"],
  });

module.exports = { resetPasswordSchema };
