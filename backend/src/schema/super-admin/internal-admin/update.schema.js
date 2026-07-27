const { z } = require("zod");

const updateAdminSchema = z.object({
    adminId: z.number({ required_error: "Admin Id is required" }),

    name: z.string().min(2).optional(),

    phone: z.string().min(8).max(15).optional(),

    isActive: z.boolean().optional(),

    isVerified: z.boolean().optional(),

    roleId: z.number().optional(),
});

module.exports = {updateAdminSchema};
