const { z } = require("zod");

const deleteSimpleBotReplySchema = z.object({
    replyId: z.number({ 
        required_error: "Reply Id is required",
        invalid_type_error: "Reply Id must be a number"
    }),
});

module.exports = { deleteSimpleBotReplySchema };
