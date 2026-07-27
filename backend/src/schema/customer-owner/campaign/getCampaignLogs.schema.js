const { z } = require("zod");

const getCampaignLogsParamsSchema = z.object({
  id: z.string().uuid("Invalid campaignId"),
});

const getCampaignLogsQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  type: z.enum(["INFO", "ERROR", "WARNING"]).optional(),
});

module.exports = {
  getCampaignLogsParamsSchema,
  getCampaignLogsQuerySchema,
};