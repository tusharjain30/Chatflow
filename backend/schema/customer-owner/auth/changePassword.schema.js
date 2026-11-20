const { z } = require("zod");

const changePasswordSchema = z.object({
    currentPassword: z.string({
        required_error: "Current password is required",
    }).min(1, "Current password is required"),

    newPassword: z.string({
        required_error: "New password is required",
    }).min(8, "New password must be at least 8 characters"),

    confirmNewPassword: z.string({
        required_error: "Confirm password is required",
    }).min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmNewPassword"],
});

module.exports = { changePasswordSchema }
