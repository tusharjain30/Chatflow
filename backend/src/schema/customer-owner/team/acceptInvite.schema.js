const { z } = require("zod");

const acceptInviteSchema = z.object({
  token: z.string().min(10, "Invalid token"),

  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  phone: z.string().min(8, "Phone number is required"),
});

module.exports = { acceptInviteSchema };