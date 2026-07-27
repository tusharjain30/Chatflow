const { z } = require("zod");

const superAdminLoginSchema = z.object({
    email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email format"),
    password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters")
        .max(64, "Password must be at most 64 characters"),
    rememberMe: z.boolean().optional(),
});

module.exports = { superAdminLoginSchema };
