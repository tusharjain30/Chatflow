const { z } = require("zod");

const updatePermissionSchema = z.object({
    permissionId: z.number({
        required_error: "permissionId is required"
    }),

    name: z
        .string()
        .min(3)
        .optional(),

    isActive: z
        .boolean()
        .optional(),
});

module.exports = { updatePermissionSchema };
