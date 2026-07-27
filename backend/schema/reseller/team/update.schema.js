const { z } = require("zod");

const resellerTeamUpdateSchema = z
  .object({
    memberId: z.string().uuid("Valid member id is required"),
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().min(8).optional(),
    teamRole: z.enum(["OWNER", "ADMIN", "ACCOUNT_MANAGER", "SUPPORT", "VIEWER"]).optional(),
    permissions: z.array(z.string().min(1)).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      ["firstName", "lastName", "phone", "teamRole", "permissions", "isActive"].some(
        (key) => Object.prototype.hasOwnProperty.call(value, key),
      ),
    {
      message: "At least one field is required",
      path: ["memberId"],
    },
  );

module.exports = { resellerTeamUpdateSchema };
