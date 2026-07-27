const { z } = require("zod");

const adminLoginAsResellerSchema = z.object({
  resellerId: z.string().min(1, "Reseller id is required"),
});

module.exports = { adminLoginAsResellerSchema };
