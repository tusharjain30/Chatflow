// validations/editSimpleBotReply.schema.js
const { z } = require("zod");

const updateSimpleBotReplySchema = z.object({
    replyId: z.number({
        required_error: "Reply Id is required",
        invalid_type_error: "Reply id must be a number"
    }),
    name: z.string({
        required_error: "Name is required"
    }).min(1, "Name is required"),

    replyText: z.string({
        required_error: "Reply Text is required"
    }).min(1, "Reply text is required"),

    isActive: z.boolean({
        invalid_type_error: "isActive must be a boolean"
    }).optional()
});

module.exports = { updateSimpleBotReplySchema };