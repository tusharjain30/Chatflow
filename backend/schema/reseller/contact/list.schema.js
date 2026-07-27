const { z } = require("zod");

const resellerContactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  accountId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
});

module.exports = { resellerContactsQuerySchema };
