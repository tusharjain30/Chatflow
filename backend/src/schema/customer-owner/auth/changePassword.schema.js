const { z } = require("zod");

const changePasswordSchema = z.object({
    currentPassword: z.string({
        required_error: "Current password is required",
    }).min(6, "Current password must be at least 6 characters"),

    newPassword: z.string({
        required_error: "New password is required",
    }).min(6, "New password must be at least 6 characters"),

    confirmNewPassword: z.string({
        required_error: "Confirm password is required",
    }).min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmNewPassword"],
});

module.exports = { changePasswordSchema }
