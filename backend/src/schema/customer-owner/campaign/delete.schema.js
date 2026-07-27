const { z } = require("zod");

const deleteCampaignParamsSchema = z.object({
  id: z.string().uuid("Invalid campaignId"),
});

module.exports = {
  deleteCampaignParamsSchema,
};