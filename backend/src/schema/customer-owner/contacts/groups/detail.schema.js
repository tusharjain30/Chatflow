const { z } = require("zod");

const detailGroupSchema = z.object({
  groupId: z
    .string({
      required_error: "Group Id is required",
      invalid_type_error: "Group Id must be a string",
    })
    .uuid("Group Id must be a valid UUID"),
});

module.exports = { detailGroupSchema };
