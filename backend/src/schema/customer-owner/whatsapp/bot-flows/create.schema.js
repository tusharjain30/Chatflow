const { z } = require("zod");

const createBotFlowSchema = z.object({
  title: z.string({
    required_error: "Title is required"
  }).min(2, "Title is required"),

  startTriggerSubject: z.string({
    required_error: "Start trigger is required"
  }).min(1, "Start trigger is required")
});

module.exports = { createBotFlowSchema };
