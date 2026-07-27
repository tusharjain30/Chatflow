const { z } = require("zod");

const customFieldDetailSchema = z.object({
  fieldId: z
    .string({
      required_error: "Field id is required",
    })
    .uuid("Invalid field id"),
});

module.exports = {
  customFieldDetailSchema,
};