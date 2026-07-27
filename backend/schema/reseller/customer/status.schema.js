const { z } = require("zod");

const updateResellerCustomerStatusSchema = z.object({
  accountId: z.string().uuid("Valid account id is required"),
  status: z.enum([
    "ACTIVE",
    "PAUSED",
    "SUSPENDED",
    "EXPIRED",
    "TRIAL",
    "PENDING_VERIFICATION",
  ]),
  reason: z.string().max(250).optional(),
  trialEndsAt: z.string().datetime().optional(),
});

module.exports = { updateResellerCustomerStatusSchema };
