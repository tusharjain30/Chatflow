const { z } = require("zod");

const updateGroupSchema = z.object({
  groupId: z
    .string({
      required_error: "Group Id is required",
      invalid_type_error: "Group Id must be a string",
    })
    .uuid("Invalid Group Id"),

  title: z
    .string({
      required_error: "Title is required",
    })
    .trim()
    .min(1, "Title is required"),

  description: z.string().optional().nullable(),
});

module.exports = { updateGroupSchema };