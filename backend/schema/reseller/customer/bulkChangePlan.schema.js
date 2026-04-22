const { z } = require("zod");

const bulkChangeResellerCustomerPlanSchema = z.object({
  accountIds: z
    .array(z.string().uuid("Valid account id is required"))
    .min(1, "At least one customer must be selected"),
  planId: z.string().uuid("Valid plan id is required"),
});

module.exports = { bulkChangeResellerCustomerPlanSchema };
