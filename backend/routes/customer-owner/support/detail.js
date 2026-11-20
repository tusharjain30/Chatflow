const express = require("express");
const router = express.Router({ mergeParams: true });

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();
const RESPONSE_CODES = require("../../../config/responseCode");
const { mapTicket } = require("./mapTicket");

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const ticketId =
      req.validatedParams?.ticketId || req.params.ticketId;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        accountId,
        isDeleted: false,
      },
    });

    if (!ticket) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Ticket not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Support ticket loaded",
      statusCode: RESPONSE_CODES.GET,
      data: mapTicket(ticket),
    });
  } catch (error) {
    console.log("Support ticket detail error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
