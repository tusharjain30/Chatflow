const RESPONSE_CODES = require("../../../../config/responseCode");
const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const { accountId } = req.auth;
    const { messageId } = req.params;

    const message = await prisma.messageLog.findFirst({
      where: {
        id: messageId,
        accountId,
      },
      include: {
        sentByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Message not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    return res.status(RESPONSE_CODES.GET).json({
      status: 1,
      message: "Message fetched successfully",
      statusCode: RESPONSE_CODES.GET,
      data: message,
    });
  } catch (error) {
    console.log("Message Detail Error:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
