const { z } = require("zod");

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid email"),
});

module.exports = { forgotPasswordSchema };
