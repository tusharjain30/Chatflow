const { z } = require("zod");

const getCustomersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform(v => Math.max(parseInt(v, 10) || 1, 1)),

  limit: z
    .string()
    .optional()
    .default("10")
    .transform(v => Math.min(Math.max(parseInt(v, 10) || 10, 1), 100)),

  search: z.string().trim().min(1).optional(),

  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform(v => v === "true"),

  isVerified: z
    .enum(["true", "false"])
    .optional()
    .transform(v => v === "true"),
});

module.exports = { getCustomersQuerySchema };
