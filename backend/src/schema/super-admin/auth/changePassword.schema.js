const { z } = require("zod");

const changePasswordSchema = z.object({
    oldPassword: z
        .string({ required_error: "Old Password is required" })
        .min(6, "Old password must be at least 6 characters"),

    newPassword: z
        .string({ required_error: "New Password is required" })
        .min(6, "New password must be at least 6 characters"),

    confirmPassword: z.string({ required_error: "Confirm Password is required" })
}).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
        message: "New Password and Confirm Password do not match",
        path: ["confirmPassword"]
    }
);

module.exports = { changePasswordSchema };