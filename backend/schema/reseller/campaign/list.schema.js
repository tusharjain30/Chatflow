const { z } = require("zod");

const resellerCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  accountId: z.string().uuid().optional(),
  status: z
    .enum(["DRAFT", "SCHEDULED", "RUNNING", "PAUSED", "COMPLETED", "FAILED", "CANCELLED"])
    .optional(),
});

module.exports = { resellerCampaignsQuerySchema };
