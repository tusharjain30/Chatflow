const { z } = require("zod");

const updateCampaignParamsSchema = z.object({
  id: z.string().uuid("Invalid campaignId"),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  templateId: z.string().uuid().optional(),
  isScheduled: z.boolean().optional(),
  scheduledAt: z.string().optional(),
  batchSize: z.number().min(1).max(100).optional(),
  delayInSeconds: z.number().min(1).max(60).optional(),
});

module.exports = {
  updateCampaignParamsSchema,
  updateCampaignSchema,
};
