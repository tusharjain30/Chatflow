const { z } = require("zod");

const resellerContactGroupsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  accountId: z.string().uuid().optional(),
  isArchived: z
    .union([z.coerce.boolean(), z.enum(["true", "false"]).transform((value) => value === "true")])
    .optional(),
});

module.exports = { resellerContactGroupsQuerySchema };
