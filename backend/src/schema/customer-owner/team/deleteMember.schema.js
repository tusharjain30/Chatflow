const { z } = require("zod");

const deleteMemberSchema = z.object({
  userId: z.string().uuid("Invalid userId"),
});

module.exports = { deleteMemberSchema };