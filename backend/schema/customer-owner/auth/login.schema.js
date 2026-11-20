const { z } = require("zod");

const userLoginSchema = z.object({
    identifier: z.string().min(3, "Email / Username / Phone is required"),
    password: z.string({
        required_error: "Password is required"
    }).min(6),
    rememberMe: z.boolean({
        required_error: "Remember me is required",
        invalid_type_error: "Remember me must be true or false",
    }),
});

module.exports = { userLoginSchema };