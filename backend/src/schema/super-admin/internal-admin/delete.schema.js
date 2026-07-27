const { z } = require("zod");

const softDeleteAdminSchema = z.object({
    adminId: z.number({ required_error: "Admin Id is required" })
});

module.exports = {softDeleteAdminSchema};
