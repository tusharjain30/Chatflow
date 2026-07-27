const { z } = require("zod");

const readGroupsBodySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isArchived: z.coerce.boolean().optional(),
  isDeleted: z.coerce.boolean().default(false),
});

module.exports = { readGroupsBodySchema };
