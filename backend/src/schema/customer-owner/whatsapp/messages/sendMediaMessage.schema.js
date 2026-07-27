const { z } = require("zod");

const sendMediaMessageSchema = z.object({
  to: z.string({
    required_error: "To is required",
  }).regex(/^\d{10,15}$/, "Invalid phone number"),
  caption: z.string().optional(),
});

module.exports = { sendMediaMessageSchema };
