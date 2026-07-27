const { z } = require("zod");

const createPermissionSchema = z.object({
    name: z
        .string({ required_error: "Name is required" })
        .min(3)
        .transform(val => val.toUpperCase())
});

module.exports = {createPermissionSchema};
