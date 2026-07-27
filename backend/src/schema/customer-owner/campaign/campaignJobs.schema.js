const { z } = require("zod");

const campaignJobsParamsSchema = z.object({
  id: z.string().uuid("Invalid campaignId"),
});

const campaignJobsQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
});

module.exports = {
  campaignJobsParamsSchema,
  campaignJobsQuerySchema,
};