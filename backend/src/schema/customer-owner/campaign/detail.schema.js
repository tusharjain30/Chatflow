const { z } = require("zod");

const getCampaignDetailSchema = z.object({
  id: z.string().uuid("Invalid campaignId"),
});

module.exports = {
  getCampaignDetailSchema,
};