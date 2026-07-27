const { z } = require("zod");

const adminListQuerySchema = z.object({
    page: z
        .string()
        .optional(),

    limit: z
        .string()
        .optional(),

    search: z
        .string()
        .optional(),

    status: z
        .enum(["true", "false"])
        .optional(),

    roleType: z
        .enum(["SYSTEM_ADMIN", "INTERNAL_ADMIN"])
        .optional(),
});

module.exports = { adminListQuerySchema };