const { z } = require("zod");

const adminResetLimitsSchema = z.object({
  accountId: z.string().min(1, "Account id is required"),
});

module.exports = { adminResetLimitsSchema };
