const { z } = require("zod");

const resumeCampaignSchema = z.object({
  campaignId: z.string().uuid("Invalid campaignId"),
});

module.exports = {
  resumeCampaignSchema,
};