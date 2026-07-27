const { z } = require("zod");

const adminLoginAsCustomerSchema = z.object({
  accountId: z.string().min(1, "Account id is required"),
});

module.exports = { adminLoginAsCustomerSchema };
