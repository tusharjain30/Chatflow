const { z } = require("zod");

const removeResellerCustomerUserSchema = z.object({
  accountId: z.string().uuid("Valid account id is required"),
  userId: z.string().uuid("Valid user id is required"),
});

module.exports = { removeResellerCustomerUserSchema };
