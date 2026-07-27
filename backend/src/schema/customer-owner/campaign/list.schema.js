const { z } = require("zod");

const getCampaignsSchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  search: z.string().optional(),
  status: z.string().optional(), // DRAFT, RUNNING, etc.
  tab: z
    .enum(["all", "active", "scheduled", "completed", "draft"])
    .optional(),
});

module.exports = {
  getCampaignsSchema,
};
