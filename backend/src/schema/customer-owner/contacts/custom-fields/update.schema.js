const { z } = require("zod");

const updateCustomFieldSchema = z.object({
  fieldId: z
    .string({
      required_error: "Field id is required",
    })
    .uuid("Invalid field id"),

  name: z
    .string({ required_error: "Name is required" })
    .min(3, "Name must be at least 3 characters")
    .max(50),

  type: z.enum(["text", "number", "email", "url", "date", "time", "datetime"]),
});

module.exports = {
  updateCustomFieldSchema,
};
