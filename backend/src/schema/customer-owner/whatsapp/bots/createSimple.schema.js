const { z } = require("zod");

const createSimpleBotSchema = z.object({
  name: z.string().min(2, "Bot name is required"),

  bodyText: z.string().min(1, "Reply text is required"),

  triggerType: z.enum([
    "DEFAULT",
    "WELCOME",
    "IS",
    "STARTS_WITH",
    "ENDS_WITH",
    "CONTAINS_WORD",
    "CONTAINS",
    "STOP_PROMOTIONAL",
    "START_PROMOTIONAL",
    "START_AI_BOT",
    "STOP_AI_BOT",
  ]),

  triggerValue: z.string().nullable().optional(),

  isActive: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // DEFAULT / WELCOME → triggerValue not allowed
  if (
    ["DEFAULT", "WELCOME"].includes(data.triggerType) &&
    data.triggerValue
  ) {
    ctx.addIssue({
      path: ["triggerValue"],
      message: "Trigger value must be empty for DEFAULT/WELCOME trigger",
    });
  }

  // Other triggers → triggerValue required
  if (
    !["DEFAULT", "WELCOME"].includes(data.triggerType) &&
    !data.triggerValue
  ) {
    ctx.addIssue({
      path: ["triggerValue"],
      message: "Trigger value is required for this trigger type",
    });
  }
});

module.exports = { createSimpleBotSchema };
