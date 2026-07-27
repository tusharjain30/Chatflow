const { z } = require("zod");

const bulkDeleteCustomFieldsSchema = z.object({
  fieldIds: z
    .array(z.string().uuid())
    .min(1, "At least one fieldId is required"),
});

module.exports = { bulkDeleteCustomFieldsSchema };