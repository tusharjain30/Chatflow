const { z } = require("zod");

const getBotByIdSchema = z.object({
  id: z
    .string({
      required_error: "Bot Id is required",
      invalid_type_error: "Id must be a string",
    })
    .uuid("Invalid bot id"),
});

module.exports = { getBotByIdSchema };
