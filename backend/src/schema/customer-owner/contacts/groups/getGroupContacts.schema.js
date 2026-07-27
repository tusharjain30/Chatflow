const { z } = require("zod");

const getGroupContactsParamsSchema = z.object({
  groupId: z.string().uuid()
});

const getGroupContactsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional()
});

module.exports = {
  getGroupContactsParamsSchema,
  getGroupContactsQuerySchema
};
