// validators/admin/role.schema.js

const { z } = require("zod");

const createRoleSchema = z.object({
    name: z
        .string({
            required_error: "Role name is required",
        }),

    roleType: z
        .enum(["SYSTEM_ADMIN", "INTERNAL_ADMIN", "CUSTOMER_USER"])
        .optional()
        .default("INTERNAL_ADMIN"),
});

module.exports = {
    createRoleSchema,
};
