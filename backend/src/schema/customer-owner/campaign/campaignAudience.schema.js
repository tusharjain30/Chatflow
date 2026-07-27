const { z } = require("zod");

const addAudienceSchema = z.object({
  campaignId: z.string().uuid("Invalid campaignId"),

  contactIds: z.array(z.string().uuid()).optional(),
  groupIds: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => data.contactIds?.length || data.groupIds?.length,
  {
    message: "At least one contactIds or groupIds is required",
  }
);

module.exports = {
  addAudienceSchema,
};