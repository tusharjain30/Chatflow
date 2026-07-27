const { z } = require("zod");

const resellerTeamCreateSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(8, "Valid phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  teamRole: z
    .enum(["OWNER", "ADMIN", "ACCOUNT_MANAGER", "SUPPORT", "VIEWER"])
    .default("SUPPORT"),
  permissions: z.array(z.string().min(1)).optional(),
});

module.exports = { resellerTeamCreateSchema };
