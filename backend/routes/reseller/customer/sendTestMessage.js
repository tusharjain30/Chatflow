const express = require("express");

const RESPONSE_CODES = require("../../../config/responseCode");
const { PrismaClient } = require("../../../generated/prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

const normalizeRecipient = (to) => {
  const digits = String(to).replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

router.post("/", async (req, res) => {
  try {
    if (req.auth.userType !== "RESELLER") {
      return res.status(RESPONSE_CODES.FORBIDDEN).json({
        status: 0,
        message: "Reseller access required",
        statusCode: RESPONSE_CODES.FORBIDDEN,
        data: {},
      });
    }

    const { accountId, to, message } = req.body;
    const account = await prisma.customerAccount.findFirst({
      where: {
        id: accountId,
        resellerId: req.auth.resellerId,
        isDeleted: false,
      },
    });

    if (!account) {
      return res.status(RESPONSE_CODES.NOT_FOUND).json({
        status: 0,
        message: "Customer account not found",
        statusCode: RESPONSE_CODES.NOT_FOUND,
        data: {},
      });
    }

    const normalizedTo = normalizeRecipient(to);
    const savedMessage = await prisma.messageLog.create({
      data: {
        accountId,
        to: normalizedTo,
        type: "TEXT",
        direction: "OUTBOUND",
        payload: {
          message,
          source: "RESELLER_TEST_MESSAGE",
        },
        messageText: message,
        status: "SENT",
      },
    });

    return res.status(RESPONSE_CODES.POST).json({
      status: 1,
      message: "Test message recorded successfully",
      statusCode: RESPONSE_CODES.POST,
      data: savedMessage,
    });
  } catch (error) {
    console.error("RESELLER SEND TEST MESSAGE ERROR:", error);
    return res.status(RESPONSE_CODES.ERROR).json({
      status: 0,
      message: "Internal server error",
      statusCode: RESPONSE_CODES.ERROR,
      data: {},
    });
  }
});

module.exports = router;
