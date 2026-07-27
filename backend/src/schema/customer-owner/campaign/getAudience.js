const { z } = require("zod");

const getAudienceParamsSchema = z.object({
  id: z.string().uuid("Invalid campaignId"),
});

const getAudienceQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  search: z.string().optional(),
});

module.exports = {
  getAudienceParamsSchema,
  getAudienceQuerySchema
};