const { z } = require("zod");

const updateResellerStatusSchema = z.object({
  resellerId: z.string().min(1, "Reseller id is required"),
  isActive: z.boolean({
    required_error: "isActive is required",
    invalid_type_error: "isActive must be a boolean",
  }),
});

module.exports = { updateResellerStatusSchema };
