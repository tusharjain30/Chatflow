const { z } = require("zod");

const resellerCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  status: z
    .enum([
      "active",
      "paused",
      "suspended",
      "expired",
      "trial",
      "pending_verification",
    ])
    .optional(),
  planId: z.string().uuid().optional(),
  revenueMin: z.coerce.number().min(0).optional(),
  revenueMax: z.coerce.number().min(0).optional(),
  usageMin: z.coerce.number().min(0).max(100).optional(),
  usageMax: z.coerce.number().min(0).max(100).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

module.exports = { resellerCustomersQuerySchema };
