const { z } = require("zod");

const customerVerificationBodySchema = z.object({
    id: z
        .number({
            required_error: "Customer id is required",
            invalid_type_error: "Customer id must be a number",
        }),
    isVerified : z.boolean({
        required_error: "isVerified  is required",
        invalid_type_error: "isVerified  must be a boolean",
    }),
});

module.exports = { customerVerificationBodySchema };