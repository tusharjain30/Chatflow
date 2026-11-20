const { z } = require("zod");

const tenantCreateSchema = z.object({
  companyName: z.string().min(2).max(120),
  ownerFirstName: z.string().min(1).max(80),
  ownerLastName: z.string().min(1).max(80),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().min(8).max(20),
  ownerPassword: z.string().min(8).max(100),
  resellerId: z.string().uuid().optional().nullable(),
  planId: z.string().uuid().optional().nullable(),
  lifecycleStatus: z
    .enum(["ACTIVE", "TRIAL", "PENDING_VERIFICATION"])
    .optional()
    .default("TRIAL"),
  trialDays: z.number().int().min(1).max(365).optional().default(14),
  timezone: z.string().optional().default("UTC"),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

module.exports = { tenantCreateSchema };
