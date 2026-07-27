const { z } = require("zod");

const updateRoleBodySchema = z
    .object({
        id: z.number({ required_error: "Role Id is required" }),
        name: z
            .string({
                required_error: "Name is required",
                invalid_type_error: "Role name must be a string",
            })
            .min(3, "Role name must be at least 3 characters")
            .max(30, "Role name must be at most 30 characters"),

        isActive: z
            .boolean({
                invalid_type_error: "isActive must be a boolean",
            })
            .optional(),
    })

module.exports = {
    updateRoleBodySchema,
};
