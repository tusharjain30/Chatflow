const { z } = require("zod");

const updatePlanStatusSchema = z.object({
  planId: z.string().trim().min(1, "Plan id is required"),
  isActive: z.boolean({
    required_error: "Status is required",
    invalid_type_error: "Status must be true or false",
  }),
});

module.exports = { updatePlanStatusSchema };
