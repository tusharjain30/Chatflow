const { z } = require("zod");

const changeResellerCustomerPlanSchema = z.object({
  accountId: z.string().uuid("Valid account id is required"),
  planId: z.string().uuid("Valid plan id is required"),
});

module.exports = { changeResellerCustomerPlanSchema };
