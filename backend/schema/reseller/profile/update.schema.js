const { z } = require("zod");

const updateResellerProfileSchema = z.object({
  companyName: z.string().min(2).optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(8).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
});

module.exports = { updateResellerProfileSchema };
