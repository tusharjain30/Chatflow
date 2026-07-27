const { z } = require("zod");

const updateMediaBotReplySchema = z.object({
    replyId: z.string({
        required_error: "Reply ID is required",
    }),

    name: z.string({
        required_error: "Name is required"
    })
        .min(1, "Reply name cannot be empty")
        .optional(),

    mediaType: z.enum(
        ["IMAGE", "VIDEO", "DOCUMENT", "AUDIO"],
        {
            required_error: "Media type is required",
            invalid_type_error: "Invalid media type"
        }
    ),

    caption: z.string().optional(),
});

module.exports = { updateMediaBotReplySchema };
