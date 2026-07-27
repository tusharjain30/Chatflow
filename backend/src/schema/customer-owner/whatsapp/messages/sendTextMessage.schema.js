const { z } = require("zod");

const sendTextMessageSchema = z.object({
  to: z.string({
    required_error: "To is required",
  }).regex(/^\d{10,15}$/, "Invalid phone number"),
  message: z.string({
    required_error: "Message is required",
  }).min(1, "Message cannot be empty"),
});

module.exports = { sendTextMessageSchema };
