const { z } = require("zod");

const createContactSchema = z.object({
  firstName: z
    .string({
      required_error: "First name is required",
      invalid_type_error: "First name must be a string",
    })
    .trim()
    .min(1, "First name is required"),

  lastName: z
    .string({
      required_error: "Last name is required",
      invalid_type_error: "Last name must be a string",
    })
    .trim()
    .min(1, "Last name is required"),
  country: z.string().optional(),

  phone: z
    .string({
      required_error: "Phone is required",
      invalid_type_error: "Phone must be a string",
    })
    .regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  languageCode: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),

  isOptedOut: z.boolean().optional(),

  groups: z.array(z.string().uuid()).optional(),

  customFields: z.record(z.any()).optional(),
  // example:
  // {
  //   "company": "Vibrantick",
  //   "email2": "x@y.com"
  // }
});

module.exports = { createContactSchema };
