const { z } = require("zod");

const adminForceActivateSchema = z.object({
  entityType: z.enum(["RESELLER", "CUSTOMER_ACCOUNT"]),
  id: z.string().min(1, "Entity id is required"),
});

module.exports = { adminForceActivateSchema };
