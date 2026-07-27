const { z } = require("zod");

const createResellerSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required"),
  firstName: z.string().trim().min(2, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().min(8, "Valid phone is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  commissionRate: z
    .number({
      required_error: "Commission rate is required",
      invalid_type_error: "Commission rate must be a number",
    })
    .min(0, "Commission rate cannot be negative")
    .max(100, "Commission rate cannot exceed 100"),
  userName: z.string().trim().min(3).optional(),
});

module.exports = { createResellerSchema };
