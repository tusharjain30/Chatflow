const { z } = require("zod");

const updateResellerCustomerUserSchema = z
  .object({
    accountId: z.string().uuid("Valid account id is required"),
    userId: z.string().uuid("Valid user id is required"),
    roleType: z.enum(["CUSTOMER_ADMIN", "CUSTOMER_AGENT"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      typeof value.isActive === "boolean" || typeof value.roleType === "string",
    {
      message: "Role or status update is required",
      path: ["roleType"],
    },
  );

module.exports = { updateResellerCustomerUserSchema };
