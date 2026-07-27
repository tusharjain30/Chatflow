const { z } = require("zod");

const updateResellerCustomerStatusSchema = z.object({
  accountId: z.string().uuid("Valid account id is required"),
  isActive: z.boolean(),
});

module.exports = { updateResellerCustomerStatusSchema };
