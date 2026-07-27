const { z } = require("zod");

const toggleArchiveGroupSchema = z.object({
    groupId: z
        .number({
            required_error: "Group Id is required",
            invalid_type_error: "Group Id must be a number",
        })
});

module.exports = { toggleArchiveGroupSchema };
