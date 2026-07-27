const { z } = require("zod");

const deleteMediaBotReplySchema = z.object({
    replyId: z.number({ 
        required_error: "Reply Id is required",
        invalid_type_error: "Reply id must be a number"
     }),
});

module.exports = { deleteMediaBotReplySchema };