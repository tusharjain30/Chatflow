const { z } = require("zod");

const resellerTeamDeleteSchema = z.object({
  memberId: z.string().uuid("Valid member id is required"),
});

module.exports = { resellerTeamDeleteSchema };
