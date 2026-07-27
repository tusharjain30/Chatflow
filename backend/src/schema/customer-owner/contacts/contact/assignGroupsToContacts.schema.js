const { z } = require("zod");

const assignGroupsToContactsSchema = z.object({
  contactIds: z
    .array(z.string().uuid())
    .min(1, "At least one contact ID is required")
    .max(1000, "Max 1000 contacts allowed")
    .transform((val) => [...new Set(val)]),

  groupIds: z
    .array(z.string().uuid())
    .min(1, "At least one group ID is required")
    .max(100, "Max 100 groups allowed")
    .transform((val) => [...new Set(val)]),
});

module.exports = { assignGroupsToContactsSchema };