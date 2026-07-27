const { z } = require("zod");

const planListQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  status: z.enum(["all", "active", "inactive"]).optional().default("all"),
});

module.exports = { planListQuerySchema };
