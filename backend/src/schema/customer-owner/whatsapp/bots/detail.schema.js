const { z } = require("zod");

const getBotByIdSchema = z.object({
  id: z
    .number({
        required_error: "Bot Id is required",
        invalid_type_error: "Id must be a number"
    })
});

module.exports = { getBotByIdSchema };
