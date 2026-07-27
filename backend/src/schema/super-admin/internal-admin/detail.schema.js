const { z } = require("zod");

const detailAdminSchema = z.object({
    adminId: z.string({ required_error: "Admin Id is required" })
});

module.exports = { detailAdminSchema };