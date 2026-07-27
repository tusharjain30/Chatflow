const { z } = require("zod");

const bulkRemoveAudienceSchema = z.object({
  campaignId: z.string().uuid("Invalid campaignId"),
  contactIds: z
    .array(z.string().uuid("Invalid contactId"))
    .optional()
    .default([]),
  groupIds: z
    .array(z.string().uuid("Invalid groupId"))
    .optional()
    .default([]),
}).refine(
  (data) => data.contactIds.length > 0 || data.groupIds.length > 0,
  {
    message: "Provide at least contactIds or groupIds",
  }
);

module.exports = {
  bulkRemoveAudienceSchema,
};