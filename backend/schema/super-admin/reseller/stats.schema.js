const { z } = require("zod");

const resellerStatsQuerySchema = z.object({
  resellerId: z.string().optional(),
});

module.exports = { resellerStatsQuerySchema };
