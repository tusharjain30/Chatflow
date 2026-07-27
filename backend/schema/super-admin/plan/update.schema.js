const { z } = require("zod");

const optionalNullableInteger = z.union([z.number().int().min(0), z.null()]);

const updatePlanSchema = z.object({
  planId: z.string().trim().min(1, "Plan id is required"),
  name: z.string().trim().min(2, "Plan name is required"),
  description: z.string().trim().max(500).optional().nullable(),
  price: z
    .number({
      required_error: "Price is required",
      invalid_type_error: "Price must be a number",
    })
    .min(0, "Price cannot be negative"),
  currency: z.string().trim().min(3, "Currency is required").max(10).optional(),
  maxTemplates: z
    .number({
      required_error: "Template limit is required",
      invalid_type_error: "Template limit must be a number",
    })
    .int("Template limit must be a whole number")
    .min(0, "Template limit cannot be negative"),
  maxBots: optionalNullableInteger,
  monthlyMessageLimit: optionalNullableInteger,
  isActive: z.boolean().optional(),
});

module.exports = { updatePlanSchema };
