const { z } = require("zod");

/* ---------- BUTTON ---------- */
const buttonSchema = z.object({
    label: z.string().min(1),
    payload: z.string().optional(),
    order: z.number().int().min(1)
});

/* ---------- CTA ---------- */
const ctaSchema = z.object({
    displayText: z.string().min(1),
    url: z.string().url()
});

/* ---------- LIST ---------- */
const listRowSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    rowId: z.string().min(1),
    order: z.number().int()
});

const listSectionSchema = z.object({
    title: z.string().min(1),
    order: z.number().int(),
    rows: z.array(listRowSchema).min(1)
});

const listSchema = z.object({
    buttonLabel: z.string().min(1),
    sections: z.array(listSectionSchema).min(1)
});

/* ---------- HEADER ---------- */
const headerSchema = z.object({
    type: z.enum(["TEXT", "IMAGE", "VIDEO", "DOCUMENT"]),
    text: z.string().optional(),
    // media: z.object({
    //     fileUrl: z.string().optional(),
    //     mimeType: z.string().optional(),
    //     metaMediaId: z.string().optional()
    // }).optional()
}).optional();

/* ---------- MAIN SCHEMA ---------- */
const createInteractiveBotReplySchema = z.object({
    botId: z.number().int(),
    name: z.string().min(1),
    nodeKey: z.string().min(1),
    parentNodeKey: z.string().optional(),

    bodyText: z.string().optional(),
    footerText: z.string().optional(),

    header: headerSchema,

    interactiveType: z.enum(["REPLY_BUTTONS", "CTA_URL", "LIST"]),

    buttons: z.array(buttonSchema).optional(),
    cta: ctaSchema.optional(),
    list: listSchema.optional()
});

module.exports = { createInteractiveBotReplySchema };
