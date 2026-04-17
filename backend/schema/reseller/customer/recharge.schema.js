const { z } = require("zod");

const rechargeResellerCustomerSchema = z.object({
  accountId: z.string().uuid("Valid account id is required"),
  amount: z.coerce.number().positive("Recharge amount must be greater than zero"),
});

module.exports = { rechargeResellerCustomerSchema };
