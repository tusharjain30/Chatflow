const { z } = require("zod");

const ticketDetailSchema = z.object({
  ticketId: z.string().uuid("Invalid ticket id"),
});

module.exports = { ticketDetailSchema };
