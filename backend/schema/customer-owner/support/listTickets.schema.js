const { z } = require("zod");

const listTicketsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  search: z.string().trim().optional().default(""),
  status: z.enum(["OPEN", "RESOLVED", "CLOSED"]).optional(),
});

module.exports = { listTicketsSchema };
