const { z } = require("zod");

const statusBotSchema = z.object({
    id: z
        .number({
            required_error: "Bot Id is required",
            invalid_type_error: "Id must be a number"
        }),
    isActive: z.boolean({
        required_error: "isActive is required",
        invalid_type_error: "isActive must be a boolean"
    }),
});

module.exports = { statusBotSchema };
