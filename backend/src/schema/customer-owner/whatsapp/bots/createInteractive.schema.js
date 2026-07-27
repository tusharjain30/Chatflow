const { z } = require("zod");

/* ---------------- BUTTON ---------------- */
const buttonSchema = z.object({
    label: z.string({
        required_error: "Button label is required",
    }).min(1, "Button label cannot be empty"),
});

/* ---------------- LIST ROW ---------------- */
const listRowSchema = z.object({
    title: z.string({
        required_error: "Row title is required",
    }).min(1, "Row title cannot be empty"),

    description: z.string().optional(),

    rowId: z.string({
        required_error: "Row ID is required",
    }).min(1, "Row ID cannot be empty"),
});

/* ---------------- LIST SECTION ---------------- */
const listSectionSchema = z.object({
    title: z.string({
        required_error: "Section title is required",
    }).min(1, "Section title cannot be empty"),

    rows: z.array(listRowSchema, {
        required_error: "At least one row is required in section",
    }).min(1, "Each section must have at least one row"),
});

/* ---------------- MAIN SCHEMA ---------------- */
const createAdvanceBotSchema = z.object({
    botName: z.string({
        required_error: "Bot name is required",
    }).min(2, "Bot name must be at least 2 characters"),

    triggerType: z.string({
        required_error: "Trigger type is required",
    }),

    triggerValue: z.string().optional().nullable(),

    replyText: z.string({
        required_error: "Reply text is required",
    }).min(1, "Reply text cannot be empty"),

    interactiveType: z.enum(["REPLY_BUTTONS", "CTA_URL", "LIST"], {
        required_error: "Interactive type is required",
    }),

    isActive: z.boolean().optional(),

    /* ---------- OPTIONAL STRUCTURES ---------- */
    buttons: z.array(buttonSchema).optional(),

    cta: z.object({
        text: z.string({
            required_error: "CTA button text is required",
        }).min(1, "CTA button text cannot be empty"),

        url: z.string({
            required_error: "CTA URL is required",
        }).url("CTA URL must be a valid URL"),
    }).optional(),

    list: z.object({
        buttonLabel: z.string({
            required_error: "List button label is required",
        }).min(1, "List button label cannot be empty"),

        sections: z.array(listSectionSchema, {
            required_error: "At least one section is required",
        }).min(1, "List must have at least one section"),
    }).optional(),

    mediaType: z.enum(["IMAGE", "VIDEO", "DOCUMENT", "AUDIO"]).optional(),
})
    .superRefine((data, ctx) => {

        /* ---------- TRIGGER RULES ---------- */
        if (
            !["DEFAULT", "WELCOME"].includes(data.triggerType) &&
            !data.triggerValue
        ) {
            ctx.addIssue({
                path: ["triggerValue"],
                message: `Trigger value is required for trigger type "${data.triggerType}"`,
            });
        }

        if (
            ["DEFAULT", "WELCOME"].includes(data.triggerType) &&
            data.triggerValue
        ) {
            ctx.addIssue({
                path: ["triggerValue"],
                message: `Trigger value must be empty for "${data.triggerType}" trigger`,
            });
        }

        /* ---------- INTERACTIVE TYPE RULES ---------- */
        if (data.interactiveType === "REPLY_BUTTONS" && !data.buttons) {
            ctx.addIssue({
                path: ["buttons"],
                message: "Buttons array is required for Reply Buttons type",
            });
        }

        if (data.interactiveType === "CTA_URL" && !data.cta) {
            ctx.addIssue({
                path: ["cta"],
                message: "CTA data (text & URL) is required for CTA URL type",
            });
        }

        if (data.interactiveType === "LIST" && !data.list) {
            ctx.addIssue({
                path: ["list"],
                message: "List data is required for List interactive type",
            });
        }
    });

module.exports = { createAdvanceBotSchema };
