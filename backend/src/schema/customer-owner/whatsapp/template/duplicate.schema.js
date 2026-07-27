const { z } = require("zod");

const duplicateTemplateSchema = z.object({
  templateId: z.string({ required_error: "Template Id is required" }).uuid("Invalid template id"),
});

module.exports = { duplicateTemplateSchema };
