const { z } = require("zod");

const listCustomFieldsSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

module.exports = {
    listCustomFieldsSchema,
};
