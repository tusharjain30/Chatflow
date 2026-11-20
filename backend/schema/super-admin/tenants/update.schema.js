const { z } = require("zod");

const tenantUpdateSchema = z.object({
  companyName: z.string().min(2).max(120).optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  timezone: z.string().optional(),
  notificationSoundEnabled: z.boolean().optional(),
  campaignResendEnabled: z.boolean().optional(),
  creditBalance: z.number().optional(),
  resellerId: z.string().uuid().optional().nullable(),
});

module.exports = { tenantUpdateSchema };
