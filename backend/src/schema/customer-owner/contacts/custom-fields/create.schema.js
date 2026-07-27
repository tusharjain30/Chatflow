const { z } = require("zod");

const createCustomFieldSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(3, "Name must be at least 3 characters")
    .max(50, "Max 50 characters")
    .trim(),

  type: z.enum(["text", "number", "email", "url", "date", "time", "datetime"]),
});

module.exports = { createCustomFieldSchema };
