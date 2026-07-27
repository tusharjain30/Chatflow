const { z } = require("zod");

const deleteContactSchema = z.object({
  contactId: z
    .string({
      required_error: "Contact Id is required",
      invalid_type_error: "Contact Id must be a string",
    })
    .uuid("Contact Id must be a valid UUID"),
});

module.exports = { deleteContactSchema };