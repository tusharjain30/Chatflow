const { z } = require("zod");

const bulkDeleteGroupSchema = z.object({
  groupIds: z
    .array(z.string().uuid())
    .min(1, "At least one group id is required"),
});

module.exports = { bulkDeleteGroupSchema };