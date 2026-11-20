const { z } = require("zod");

const updateAccountSchema = z.object({
  companyName: z
    .string({ required_error: "Company name is required" })
    .min(2, "Company name is too short")
    .optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phone: z.string().min(10, "Invalid phone number").optional(),
  address: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  zipCode: z.string().trim().max(30).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  timezone: z.string().trim().min(1).max(64).optional(),
  notificationSoundEnabled: z.boolean().optional(),
  campaignResendEnabled: z.boolean().optional(),
});

module.exports = { updateAccountSchema };
