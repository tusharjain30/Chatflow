const { z } = require("zod");

const resellerTeamListSchema = z.object({
  search: z.string().optional(),
  teamRole: z.enum(["OWNER", "ADMIN", "ACCOUNT_MANAGER", "SUPPORT", "VIEWER"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

module.exports = { resellerTeamListSchema };
