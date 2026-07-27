const { z } = require("zod");

const retryCampaignSchema = z.object({
  campaignId: z.string().uuid("Invalid campaignId"),
});

module.exports = {
  retryCampaignSchema,
};