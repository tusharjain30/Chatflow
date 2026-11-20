const { z } = require("zod");

const tenantStatusSchema = z.object({
  action: z.enum(["activate", "suspend", "archive"]),
  reason: z.string().max(500).optional().nullable(),
});

module.exports = { tenantStatusSchema };
