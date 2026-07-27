const { z } = require("zod");

const listMembersSchema = z.object({
  search: z.string().optional(),
  roleType: z.enum(["CUSTOMER_ADMIN", "CUSTOMER_AGENT"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),

  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

module.exports = { listMembersSchema };