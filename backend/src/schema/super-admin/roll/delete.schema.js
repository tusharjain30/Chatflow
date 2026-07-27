const { z } = require("zod");

const deleteRoleSchema = z.object({
    roleId: z.number({ required_error: "Role Id is required" }),
});

module.exports = {
    deleteRoleSchema
};