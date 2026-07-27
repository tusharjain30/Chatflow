const { z } = require("zod");

const bulkSendResellerCampaignSchema = z.object({
  accountIds: z
    .array(z.string().uuid("Valid account id is required"))
    .min(1, "At least one customer must be selected"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message is too long"),
});

module.exports = { bulkSendResellerCampaignSchema };
