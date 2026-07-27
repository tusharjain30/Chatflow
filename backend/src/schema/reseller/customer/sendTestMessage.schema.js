const { z } = require("zod");

const sendResellerTestMessageSchema = z.object({
  accountId: z.string().uuid("Valid account id is required"),
  to: z.string().min(8, "Recipient phone is required"),
  message: z.string().min(1, "Message is required").max(1000, "Message is too long"),
});

module.exports = { sendResellerTestMessageSchema };
