const {z} = require("zod");

const updateStatusSchema = z.object({
    adminId: z.number({ required_error: "Admin Id is required" }),
    isActive: z.boolean({
        required_error: "isActive is required",
        invalid_type_error: "isActive must be a boolean",
    }),
});

module.exports = {
    updateStatusSchema,
}