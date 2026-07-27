const { z } = require("zod");

const createContactGroupSchema = z.object({
    title: z.string({
        required_error: "Title is required"
    }).min(1, "Title is required"),
    description: z.string().optional()
});

module.exports = { createContactGroupSchema };
