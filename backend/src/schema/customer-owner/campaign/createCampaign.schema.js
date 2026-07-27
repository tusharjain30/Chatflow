// validations/campaign.validation.js

const { z } = require("zod");

const createCampaignSchema = z.object({
  name: z.string().min(3, "Campaign name is required"),

  description: z.string().optional(),

  templateId: z.string().uuid("Invalid templateId"),

  isScheduled: z.boolean().optional().default(false),

  scheduledAt: z
    .string()
    .datetime()
    .optional()
    .refine((val) => !val || new Date(val) > new Date(), {
      message: "Scheduled time must be in future",
    }),

  batchSize: z
    .number()
    .min(1)
    .max(500)
    .optional()
    .default(50),

  delayInSeconds: z
    .number()
    .min(1)
    .max(60)
    .optional()
    .default(2),
});

module.exports = {
  createCampaignSchema,
};