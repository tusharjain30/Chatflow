const { z } = require("zod");

const resendInviteSchema = z.object({
  inviteId: z.string().uuid("Invalid invite ID"),
});

module.exports = { resendInviteSchema };