const { z } = require("zod");

const removePermissionSchema = z.object({
    roleId: z.number({
        required_error: "roleId is required"
    }),
    permissionId: z.number({
        required_error: "permissionId is required"
    })
});

module.exports = { removePermissionSchema };
