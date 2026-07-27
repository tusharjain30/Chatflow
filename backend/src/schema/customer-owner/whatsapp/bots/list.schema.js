const { z } = require("zod");

const getAllBotsSchema = z.object({
    page: z
        .string()
        .optional()
        .default("1")
        .transform(v => Number(v))
        .refine(v => Number.isInteger(v) && v > 0, {
            message: "Page must be a positive integer",
        }),

    limit: z
        .string()
        .optional()
        .default("10")
        .transform(v => Number(v))
        .refine(v => Number.isInteger(v) && v > 0 && v <= 100, {
            message: "Limit must be between 1 and 100",
        }),

    search: z.string().trim().optional(),

    botType: z.enum(["SIMPLE", "FLOW", "AI"]).optional(),

    triggerType: z.enum([
        "DEFAULT",
        "KEYWORD",
        "BUTTON",
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
    ]).optional(),

    isActive: z
        .enum(["true", "false"])
        .optional()
        .transform(v => (v === "true" ? true : v === "false" ? false : undefined)),
});

module.exports = { getAllBotsSchema };
