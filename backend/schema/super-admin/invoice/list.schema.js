const { z } = require("zod");

const invoiceListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  resellerId: z.string().optional(),
  customerId: z.string().optional(),
  status: z.enum(["paid", "archived"]).optional(),
});

module.exports = { invoiceListQuerySchema };
