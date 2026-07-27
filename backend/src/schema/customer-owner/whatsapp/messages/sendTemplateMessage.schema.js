const { z } = require("zod");

const sendTemplateMessageSchema = z.object({
  to: z.string({
    required_error: "To is required",
  }).regex(/^\d{10,15}$/, "Invalid phone number"),
  templateId: z.string({
    required_error: "Template Id is required",
  }).uuid("Invalid template id"),
  variables: z.array(z.union([z.string(), z.number(), z.boolean()])).optional().default([]),
});

module.exports = { sendTemplateMessageSchema };
