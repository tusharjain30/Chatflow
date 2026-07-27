const { z } = require("zod");

const startCampaignSchema = z.object({
  campaignId: z.string().uuid("Invalid campaignId"),
});

module.exports = {
  startCampaignSchema,
};