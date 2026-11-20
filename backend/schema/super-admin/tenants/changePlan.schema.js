const { z } = require("zod");

const tenantChangePlanSchema = z.object({
  planId: z.string().uuid(),
});

module.exports = { tenantChangePlanSchema };
