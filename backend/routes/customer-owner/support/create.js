const express = require("express");
const router = express.Router();

const { PrismaClient } = require("../../../generated/prisma/client");
const prisma = new PrismaClient();
const RESPONSE_CODES = require("../../../config/responseCode");
const { mapTicket, buildTicketRef } = require("./mapTicket");

router.post("/", async (req, res) => {
  try {
    const { accountId, userId } = req.auth;
    const { subject, description, category, priority } = req.body;

    const existingCount = await prisma.supportTicket.count({
      where: { accountId },
    });

    let ticket = null;
    let attempts = 0;

    while (attempts < 5) {
      const ref = buildTicketRef(existingCount + 1 + attempts);
      try {
        ticket = await prisma.supportTicket.create({
          data: {
            accountId,
            createdByUserId: userId || null,
            ref,
            subject: subject.trim(),
            description: description.trim(),
            category,
            priority: priority || "NOT_SET",
            status: "OPEN",
          },
        });
        break;
      } catch (error) {
        if (error?.code === "P2002") {
          attempts += 1;
          continue;
        }
        throw error;
      }
    }

    if (!ticket) {
      return res.status(RESPONSE_CODES.ERROR).json({
        status: 0,
        message: "Unable to generate ticket reference",
        statusCode: RESPONSE_CODES.ERROR,
        data: {},
      });
    }

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Support ticket created",
      statusCode: RESPONSE_CODES.POST,
      data: mapTicket(ticket),
    });
  } catch (error) {
    console.log("Support ticket create error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Something went wrong",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
