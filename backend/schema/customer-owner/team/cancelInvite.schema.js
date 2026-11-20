const { z } = require("zod");

const cancelInviteSchema = z.object({
  inviteId: z.string().uuid("Invalid invite id"),
});

module.exports = { cancelInviteSchema };
