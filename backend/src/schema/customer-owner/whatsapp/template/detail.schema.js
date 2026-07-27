const { z } = require("zod");

const templateDetailSchema = z.object({
  templateId: z.string({ required_error: "Template Id is required" }).uuid("Invalid template id"),
});

module.exports = { templateDetailSchema };
