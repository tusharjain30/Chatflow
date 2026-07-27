const { z } = require("zod");

const pauseCampaignSchema = z.object({
  campaignId: z.string().uuid("Invalid campaignId"),
});

module.exports = {
  pauseCampaignSchema,
};