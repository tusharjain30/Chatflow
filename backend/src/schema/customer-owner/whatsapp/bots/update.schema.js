const { z } = require("zod");

/* ---------------- BUTTON ---------------- */
const buttonSchema = z.object({
    label: z.string().min(1, "Button label is required"),
});

/* ---------------- LIST ROW ---------------- */
const listRowSchema = z.object({
    title: z.string().min(1, "Row title is required"),
    description: z.string().optional(),
    rowId: z.string().min(1, "Row ID is required"),
});

/* ---------------- LIST SECTION ---------------- */
const listSectionSchema = z.object({
    title: z.string().min(1, "Section title is required"),
    rows: z.array(listRowSchema).min(1, "At least one row is required"),
});

/* ---------------- MAIN UPDATE SCHEMA ---------------- */
const updateBotReplySchema = z
    .object({
        replyId: z
            .string({
                required_error: "Reply ID is required",
                invalid_type_error: "Reply ID must be a string",
            })
            .transform((val) => Number(val))
            .refine(
                (val) => Number.isInteger(val) && val > 0,
                "Reply ID must be a valid positive number"
            ),
        replyType: z.enum(["SIMPLE", "MEDIA", "INTERACTIVE"], {
            required_error: "Reply type is required",
        }),

        replyText: z.string().optional(),

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
        ]),

        triggerValue: z.string().optional().nullable(),

        isActive: z.boolean().optional(),

        /* -------- MEDIA -------- */
        mediaType: z
            .enum(["IMAGE", "VIDEO", "DOCUMENT", "AUDIO"])
            .optional(),

        /* -------- INTERACTIVE -------- */
        interactiveType: z
            .enum(["REPLY_BUTTONS", "CTA_URL", "LIST"])
            .optional(),

        buttons: z.array(buttonSchema).optional(),

        cta: z
            .object({
                text: z.string().min(1, "CTA text is required"),
                url: z.string().url("CTA URL must be valid"),
            })
            .optional(),

        list: z
            .object({
                buttonLabel: z.string().min(1, "List button label is required"),
                sections: z.array(listSectionSchema).min(1),
            })
            .optional(),
    })
    .superRefine((data, ctx) => {
        /* ---------- TRIGGER RULES ---------- */
        if (
            !["DEFAULT", "WELCOME"].includes(data.triggerType) &&
            !data.triggerValue
        ) {
            ctx.addIssue({
                path: ["triggerValue"],
                message: `Trigger value is required for ${data.triggerType}`,
            });
        }

        if (
            ["DEFAULT", "WELCOME"].includes(data.triggerType) &&
            data.triggerValue
        ) {
            ctx.addIssue({
                path: ["triggerValue"],
                message: `Trigger value must be empty for ${data.triggerType}`,
            });
        }

        /* ---------- MEDIA RULES ---------- */
        if (data.replyType === "MEDIA" && !data.mediaType) {
            ctx.addIssue({
                path: ["mediaType"],
                message: "Media type is required for MEDIA reply",
            });
        }

        /* ---------- INTERACTIVE RULES ---------- */
        if (data.replyType === "INTERACTIVE") {
            if (!data.interactiveType) {
                ctx.addIssue({
                    path: ["interactiveType"],
                    message: "Interactive type is required",
                });
            }

            if (data.interactiveType === "REPLY_BUTTONS" && !data.buttons) {
                ctx.addIssue({
                    path: ["buttons"],
                    message: "Buttons are required for reply buttons",
                });
            }

            if (data.interactiveType === "CTA_URL" && !data.cta) {
                ctx.addIssue({
                    path: ["cta"],
                    message: "CTA data is required for CTA URL",
                });
            }

            if (data.interactiveType === "LIST" && !data.list) {
                ctx.addIssue({
                    path: ["list"],
                    message: "List data is required for LIST type",
                });
            }
        }
    });

module.exports = { updateBotReplySchema };
