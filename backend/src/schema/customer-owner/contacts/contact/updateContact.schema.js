const { z } = require("zod");

const updateContactSchema = z.object({
  contactId: z
    .string({
      required_error: "Contact Id is required",
      invalid_type_error: "Contact Id must be a string",
    })
    .uuid("Contact Id must be a valid UUID"),

  firstName: z.string().min(1, "First name cannot be empty").optional(),

  lastName: z.string().optional(),

  country: z
    .string()
    .min(2, "Country must be at least 2 characters")
    .optional(),

  languageCode: z.string().optional(),

  email: z.string().email("Invalid email format").optional(),

  isOptedOut: z
    .boolean({
      invalid_type_error: "isOptedOut must be a boolean",
    })
    .optional(),

  groups: z.array(z.string().uuid("Group Id must be a valid UUID")).optional(),

  customFields: z.record(z.any()).optional(),
});

module.exports = { updateContactSchema };
