const { z } = require("zod");

const bulkDeleteContactsSchema = z.object({
  contactIds: z
    .array(z.string().uuid("Invalid contactId UUID"))
    .min(1, "At least one contactId is required"),
});

module.exports = {
  bulkDeleteContactsSchema,
};