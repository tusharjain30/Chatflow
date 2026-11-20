const { z } = require("zod");

const statusBotSchema = z.object({
    id: z
        .string({
            required_error: "Bot Id is required",
            invalid_type_error: "Id must be a string",
        })
        .uuid("Invalid bot id"),
    isActive: z.boolean({
        required_error: "isActive is required",
        invalid_type_error: "isActive must be a boolean"
    }),
});

module.exports = { statusBotSchema };
