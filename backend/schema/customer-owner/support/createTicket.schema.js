const { z } = require("zod");

const createTicketSchema = z.object({
  subject: z.string().trim().min(3, "Subject is required"),
  description: z.string().trim().min(1, "Description is required"),
  category: z.enum([
    "WHATSAPP_ISSUE",
    "BILLING",
    "ACCOUNT_ACCESS",
    "CAMPAIGNS",
    "OTHER",
  ]),
  priority: z
    .enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "NOT_SET"])
    .optional()
    .default("NOT_SET"),
});

module.exports = { createTicketSchema };
