const { z } = require("zod");

const addResellerTeamMemberSchema = z.object({
  accountId: z.string().uuid("Valid account id is required"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(8, "Valid phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleType: z.enum(["CUSTOMER_ADMIN", "CUSTOMER_AGENT"]).optional().default("CUSTOMER_AGENT"),
});

module.exports = { addResellerTeamMemberSchema };
