const {z} = require("zod");

const forceLogoutSchema = z.object({
    adminId: z.number({ required_error: "Admin Id is required" }),
});

module.exports = {
    forceLogoutSchema,
}