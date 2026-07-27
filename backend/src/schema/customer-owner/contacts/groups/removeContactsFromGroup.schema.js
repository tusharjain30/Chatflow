const { z } = require("zod");

const removeContactsFromGroupSchema = z.object({
  groupId: z.string().uuid(),
  contactIds: z
    .array(z.string().uuid())
    .min(1, "At least 1 contact is required"),
});

module.exports = { removeContactsFromGroupSchema };
