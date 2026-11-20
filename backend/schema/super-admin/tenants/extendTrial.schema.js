const { z } = require("zod");

const tenantExtendTrialSchema = z.object({
  days: z.number().int().min(1).max(365).default(7),
});

module.exports = { tenantExtendTrialSchema };
