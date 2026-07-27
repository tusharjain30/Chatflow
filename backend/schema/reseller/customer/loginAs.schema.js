const { z } = require("zod");

const loginAsResellerCustomerSchema = z.object({
  accountId: z.string().uuid("Valid account id is required"),
});

module.exports = { loginAsResellerCustomerSchema };
