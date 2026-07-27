const { z } = require("zod");

const deleteCustomFieldSchema = z.object({
  fieldId: z
    .string({
      required_error: "Field id is required",
    })
    .uuid("Invalid field id"),
});

module.exports = {
  deleteCustomFieldSchema,
};
