const { z } = require("zod");

const createMediaBotReplySchema = z.object({
    botId: z.string({
        required_error: "Bot ID is required",
    }),

    name: z.string({
        required_error: "Reply name is required"
    }).min(1, "Reply name cannot be empty"),

    parentNodeKey: z.string({
        required_error: "Parent node key is required"
    }).min(1, "Parent node key cannot be empty"),

    mediaType: z.enum(
        ["IMAGE", "VIDEO", "DOCUMENT", "AUDIO"],
        {
            required_error: "Media type is required",
            invalid_type_error: "Invalid media type"
        }
    ),

    caption: z.string().optional()
});

module.exports = { createMediaBotReplySchema };
