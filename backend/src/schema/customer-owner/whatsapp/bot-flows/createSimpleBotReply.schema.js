const { z } = require("zod");

const createSimpleBotReplySchema = z.object({
  botId: z.number({
    required_error: "Bot Id is required",
    invalid_type_error: "Bot id must be a number"
  }),
  
  name: z.string({
    required_error: "Name is required"
  }).min(2, "Name is required"),

  replyText: z.string({
    required_error: "replyText is required"
  }).min(1, "replyText is required"),

  parentNodeKey: z.string({
    required_error: "parentNodeKey is required"
  }).min(1, "parentNodeKey is required"),
});

module.exports = { createSimpleBotReplySchema };
