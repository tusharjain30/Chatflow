const { z } = require("zod");

const createMediaBotSchema = z.object({
  botName: z.string({
     required_error: "Bot name is required"
  }).min(2, "Bot name is required"),

  replyText: z.string({
    required_error: "Reply Text is required"
  }),

  triggerType: z.enum([
    "WELCOME",
    "DEFAULT",
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

  triggerValue: z.string().optional().nullable(),

  mediaType: z.enum([
    "IMAGE",
    "VIDEO",
    "DOCUMENT",
    "AUDIO",
  ], {
    required_error: "Media Type is required"
  }),

  isActive: z.boolean().optional(),
}).superRefine((data, ctx) => {

  if (
    !["WELCOME", "DEFAULT"].includes(data.triggerType) &&
    !data.triggerValue
  ) {
    ctx.addIssue({
      path: ["triggerValue"],
      message: "Trigger value is required for this trigger type",
    });
  }

  if (
    ["WELCOME", "DEFAULT"].includes(data.triggerType) &&
    data.triggerValue
  ) {
    ctx.addIssue({
      path: ["triggerValue"],
      message: "Trigger value must be empty for DEFAULT/WELCOME trigger",
    });
  }
});

module.exports = { createMediaBotSchema };
