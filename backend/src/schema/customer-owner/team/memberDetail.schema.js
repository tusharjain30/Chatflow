const { z } = require("zod");

const memberDetailSchema = z.object({
  userId: z.string().uuid("Invalid userId"),
});

module.exports = { memberDetailSchema };