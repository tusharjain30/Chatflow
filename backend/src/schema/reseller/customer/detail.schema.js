const { z } = require("zod");

const resellerCustomerDetailSchema = z.object({
  accountId: z.string().uuid("Valid account id is required"),
});

module.exports = { resellerCustomerDetailSchema };
