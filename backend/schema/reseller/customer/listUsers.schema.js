const { z } = require("zod");

const listResellerCustomerUsersSchema = z.object({
  accountId: z.string().uuid("Valid account id is required"),
});

module.exports = { listResellerCustomerUsersSchema };
