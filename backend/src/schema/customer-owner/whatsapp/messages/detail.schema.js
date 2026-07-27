const { z } = require("zod");

const messageDetailSchema = z.object({
  messageId: z.string({ required_error: "Message Id is required" }).uuid("Invalid message id"),
});

module.exports = { messageDetailSchema };
