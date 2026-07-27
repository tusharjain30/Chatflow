const { z } = require("zod");

const updateBotFlowSchema = z.object({
    botId: z.number({ required_error: "Bot Id is required" }),
    title: z.string({
        required_error: "Title is required"
    }).min(2, "Title is required"),

    startTriggerSubject: z.string({
        required_error: "Start trigger is required"
    }).min(1, "Start trigger is required"),
    isActive: z.boolean({
        invalid_type_error: "isActive must be a boolean"
    }).optional()
});

module.exports = { updateBotFlowSchema };
