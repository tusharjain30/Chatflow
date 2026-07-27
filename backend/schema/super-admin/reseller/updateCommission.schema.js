const { z } = require("zod");

const updateResellerCommissionSchema = z.object({
  resellerId: z.string().min(1, "Reseller id is required"),
  commissionRate: z
    .number({
      required_error: "Commission rate is required",
      invalid_type_error: "Commission rate must be a number",
    })
    .min(0, "Commission rate cannot be negative")
    .max(100, "Commission rate cannot exceed 100"),
});

module.exports = { updateResellerCommissionSchema };
