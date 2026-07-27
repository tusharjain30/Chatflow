const { z } = require("zod");

const assignPermissionSchema = z.object({
  roleId: z.number({
    required_error: "roleId is required"
  }),
  permissionIds: z
    .array(z.number())
    .min(1, "At least one permission required")
});

module.exports = {assignPermissionSchema};

