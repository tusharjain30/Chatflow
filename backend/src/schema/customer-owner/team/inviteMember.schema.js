const { z } = require("zod");

const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),

  roleType: z.enum(["CUSTOMER_ADMIN", "CUSTOMER_AGENT"], {
    errorMap: () => ({ message: "Invalid role selected" }),
  }),
});

module.exports = { inviteMemberSchema };