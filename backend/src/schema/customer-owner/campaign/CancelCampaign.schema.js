const { z } = require("zod");

const cancelCampaignSchema = z.object({
  campaignId: z.string().uuid("Invalid campaignId"),
});

module.exports = {
  cancelCampaignSchema,
};