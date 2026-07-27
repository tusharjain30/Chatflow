const { z } = require("zod");

const bulkDeleteMembersSchema = z.object({
  userIds: z
    .array(z.string().uuid("Invalid userId"))
    .min(1, "At least one userId is required"),
});

module.exports = { bulkDeleteMembersSchema };
