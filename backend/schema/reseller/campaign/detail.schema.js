const { z } = require("zod");

const resellerCampaignDetailSchema = z.object({
  campaignId: z.string().uuid("Invalid campaign id"),
});

module.exports = { resellerCampaignDetailSchema };
