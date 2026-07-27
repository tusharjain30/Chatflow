const { z } = require("zod");

const updateMemberSchema = z.object({
  userId: z.string().uuid("Invalid userId"),

  roleType: z.enum(["CUSTOMER_ADMIN", "CUSTOMER_AGENT"]).optional(),

  isActive: z.boolean().optional(),
});

module.exports = { updateMemberSchema };
