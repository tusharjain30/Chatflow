const { z } = require("zod");

const customerStatusBodySchema = z.object({
    id: z
        .number({
            required_error: "Customer id is required",
            invalid_type_error: "Customer id must be a number",
        }),
    isActive: z.boolean({
        required_error: "isActive is required",
        invalid_type_error: "isActive must be a boolean",
    }),
});

module.exports = { customerStatusBodySchema };