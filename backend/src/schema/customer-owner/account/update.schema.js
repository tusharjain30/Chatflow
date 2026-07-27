const { z } = require("zod");

const updateAccountSchema = z.object({
  companyName: z.string({ required_error: "Company name is required" }).min(2, "Company name is too short").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phone: z.string().min(10, "Invalid phone number").optional(),
});

module.exports = { updateAccountSchema };
