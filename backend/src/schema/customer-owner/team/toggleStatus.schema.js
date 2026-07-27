const { z } = require("zod");

const toggleStatusSchema = z.object({
  userId: z.string().uuid("Invalid userId"),
});

module.exports = { toggleStatusSchema };