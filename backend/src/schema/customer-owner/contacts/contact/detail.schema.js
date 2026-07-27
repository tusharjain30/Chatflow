const { z } = require("zod");

const detailContactSchema = z.object({
  contactId: z.string().uuid("Invalid contact UUID"),
});

module.exports = { detailContactSchema };