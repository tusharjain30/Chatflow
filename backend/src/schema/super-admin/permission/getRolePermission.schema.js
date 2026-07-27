const { z } = require("zod");

const getRolePermissionSchema = z.object({
    roleId: z.string({
        required_error: "roleId is required"
    })
});

module.exports = { getRolePermissionSchema };