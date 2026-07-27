const { z } = require("zod");

const deleteBotFlowSchema = z.object({
    botId: z.number({ 
        required_error: "Bot Id is required",
        invalid_type_error: "Bot id must be a number"
     }),
});

module.exports = { deleteBotFlowSchema };