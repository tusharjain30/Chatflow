const { z } = require("zod");

const resellerListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

module.exports = { resellerListQuerySchema };
