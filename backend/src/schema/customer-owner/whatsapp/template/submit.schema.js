const { z } = require("zod");

const submitTemplateSchema = z.object({
  templateId: z.string({ required_error: "Template Id is required" }).uuid("Invalid template id"),
});

module.exports = { submitTemplateSchema };
