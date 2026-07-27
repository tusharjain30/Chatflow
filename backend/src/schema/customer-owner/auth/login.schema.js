const { z } = require("zod");

const userLoginSchema = z.object({
    identifier: z.string().min(3, "Email / Username / Phone is required"),
    password: z.string({
        required_error: "Password is required"
    }).min(6),
    rememberMe: z.boolean().optional().default(false),
});

module.exports = { userLoginSchema };