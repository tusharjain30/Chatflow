const { z } = require("zod");

const assignRoleToAdminSchema = z.object({
    adminId: z.number({ required_error: "Admin Id is required" }),
    roleId: z.number({ required_error: "Role Id is required" }),
});

module.exports = {
    assignRoleToAdminSchema,
};