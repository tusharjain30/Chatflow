const { z } = require("zod");

const getRoleByIdSchema = z.object({
    id: z.number({ required_error: "Role Id is required" }),
});

module.exports = {
    getRoleByIdSchema,
};