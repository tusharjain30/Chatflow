const { z } = require("zod");

const emptyToUndefined = z.literal("").transform(() => undefined);

const tenantListQuerySchema = z.object({
  search: z.string().optional(),
  status: z
    .enum(["all", "active", "suspended", "trial", "archived", "inactive"])
    .optional()
    .default("all"),
  planId: z.string().uuid().optional().or(emptyToUndefined),
  resellerId: z.string().uuid().optional().or(emptyToUndefined),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
});

module.exports = { tenantListQuerySchema };
