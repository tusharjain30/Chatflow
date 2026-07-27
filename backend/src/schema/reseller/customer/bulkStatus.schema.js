const { z } = require("zod");

const bulkResellerCustomerStatusSchema = z.object({
  accountIds: z
    .array(z.string().uuid("Valid account id is required"))
    .min(1, "At least one customer must be selected"),
  isActive: z.boolean(),
});

module.exports = { bulkResellerCustomerStatusSchema };
