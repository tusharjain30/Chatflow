const { z } = require("zod");

const bulkDeleteCampaignSchema = z.object({
  campaignIds: z
    .array(z.string().uuid("Invalid campaignId"))
    .min(1, "At least one campaignId is required"),
});

module.exports = {
  bulkDeleteCampaignSchema,
};