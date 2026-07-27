const { z } = require("zod");

const adminToolCustomerListSchema = z.object({
  search: z.string().optional(),
  resellerId: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

module.exports = { adminToolCustomerListSchema };
