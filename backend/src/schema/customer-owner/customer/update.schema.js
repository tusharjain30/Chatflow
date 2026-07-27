const { z } = require("zod");

const updateCustomerBodySchema = z
    .object({
        id: z
            .number({
                required_error: "Customer Id is required",
                invalid_type_error: "Id must be a number",
            }),
        name: z
            .string({ required_error: "Name is required" })
            .trim()
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name must be at most 100 characters"),

        isActive: z
            .boolean({
                required_error: "isActive is required",
                invalid_type_error: "isActive must be a boolean",
            }),
    });

module.exports = {
    updateCustomerBodySchema,
};
